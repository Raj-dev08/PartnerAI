import User from "../model/user.model.js";
import UserReference from "../model/userReference.model.js";
import bcrypt from 'bcryptjs'
import { redis } from "../lib/redis.js";
import axios from 'axios';
import { otpEmailTemplate } from "../templates/otp.template.js";
import { generateSessionId } from "../lib/refresh.token.js";
import jwt from "jsonwebtoken"

function generateOTP() {
  return Math.floor( 100000 + Math.random() * 900000 ).toString()
}

export const sendOtp = async (req,res,next) => {
    try {
      const { email, name  , password, expoPushToken , birthday , gender} = req.body;
      
      if ( !email || !name || !password || !birthday || !gender){
        return res.status(400).json({ message: "All fields are required "});
      }

      if(!new Date(birthday).getTime()){
        return res.status(400).json({ message: "Invalid birthday format. Use YYYY-MM-DD" });
      }
      

      if ( password.length < 4 ){
        return res.status(400).json({ message: "Password must be atleast 4 characters long"}) // add more robust checking later like checking for uniqueness
      }

      if (!["male","female","other"].includes(gender)){
        return res.status(400).json({ message: "Invalid gender"})
      }

      const existingUser = await User.findOne({ email })

      if( existingUser ){
        return res.status(400).json({ message: "User with Email already exists "})
      }

      const otp = generateOTP();

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userPayLoad = {
        name,
        email,
        birthday: new Date(birthday),
        gender,
        password:hashedPassword,
        expoPushToken: expoPushToken || ""
      }

      await redis.set(`UserInfo:${email}`, JSON.stringify(userPayLoad) , "EX", 60 * 5 )
      await redis.set(`OTP:${email}`, otp, "EX" , 60 * 5 ) //valid for 5 min

      try {
        await axios.post(
          "https://api.brevo.com/v3/smtp/email",
            {
              sender: { name: "Partner AI", email: process.env.EMAIL_USER},
              to: [{ email }],
              subject: "Verification Code",
              htmlContent: otpEmailTemplate(otp)
            },
            {
              headers: {
                "api-key": process.env.BREVO_API_KEY,
                "content-type": "application/json",
              },
            }
        );
      } catch (error) {
        await redis.del(`UserInfo:${email}`);
        await redis.del(`OTP:${email}`);
        console.error("Error sending OTP email:", error.response ? error.response.data : error.message);
        return next(error);
      }
      return res.status(200).json({ message: "OTP sent successfully"})
    } catch (error) { 
      next(error)
    }
}

export const verifyOTP = async (req,res,next) => {
  try {
    const { email, otp } = req.body;

    if ( !email || !otp ){
      return res.status(400).json({ message: "All fields are required "})
    }

    const storedOtp = await redis.get(`OTP:${email}`)
    const userDataRaw = await redis.get(`UserInfo:${email}`)

    if (!userDataRaw) {
      return res.status(400).json({ message: "User data expired or not found"})
    }

    const userData = JSON.parse(userDataRaw)


    if (!storedOtp || !userData){
      return res.status(400).json({ message: "OTP and data expired or not found"})
    }

    if( storedOtp !== otp.toString() ){
      return res.status(400).json({ message: "Invalid OTP "})
    }

    const userReference = await UserReference.create({
      userId: userData._id
    })

    const newUser = new User(userData)

    newUser.userReference = userReference._id
    
    if (newUser) {
      await newUser.save();

      const sessionId = await generateSessionId(newUser._id, 0) // default refresh token version is 0 when user is created
    
      const token = jwt.sign({ userId: newUser._id, sessionId }, process.env.JWT_SECRET, { expiresIn: "15m" })

      await redis.del(`UserInfo:${email}`);
      await redis.del(`OTP:${email}`);

      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        age: newUser.age,
        gender: newUser.gender,
        token,
        sessionId
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    next(error)
  }
}


export const login = async (req, res) => {
    const { email, password} = req.body;

    try {
        
        const user= await User.findOne({email});

        if(!user){
            return res.status(400).json({message: "User with the email does not exist"});
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect){
            return res.status(400).json({message: "Invalid credentials"});
        }


        const sessionId = await generateSessionId(user._id, user.refreshTokenVersion)

        const token = jwt.sign({ userId: user._id, sessionId }, process.env.JWT_SECRET, { expiresIn: "15m" })
        
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            age: user.age,
            gender: user.gender,
            token,
            sessionId
        });
    } catch (error) {
        console.log("Error in login:", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }

}

export const logout = async (req, res) => { // jwt gets cleared on client side just remove expo push token from db to stop sending notifications
    try {
        const {user} =req
        if(!user){
          return res.status(401).json({ message: "Unauthorized"})
        }
        const sessionId = req.sessionId;
        await redis.del(`sessionId:${sessionId}`) // delete session from redis to invalidate the refresh token
        await User.findByIdAndUpdate(user._id, { expoPushToken: "" })  
        res.status(200).json({message: "User logged out successfully"});    
    } catch (error) {
        console.log("Error in logout:", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export const checkAuth = (req, res) => {
  try {
    if(!req.user){
      return res.status(401).json({message : "unauthorized access"});
    }  
    return res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const updateExpoPushToken = async (req, res, next) => {
  try {
    const { expoPushToken } = req.body;
    const userId = req.user._id;

    if (!expoPushToken) return res.status(400).json({ message: 'Expo push token required' });

    await User.findByIdAndUpdate(userId, { expoPushToken });
    res.status(200).json({ message: 'Expo push token saved successfully' });
  } catch (error) {
    next(error)
  }
};

export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;
        const sessionId = req.sessionId;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new passwords are required' });
        }

        if ( newPassword.length < 4 ) {
          return res.status(400).json({ message: "Password must be atleast 4 characters long"})
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }   

        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.refreshTokenVersion += 1; // increment refresh token version to invalidate existing refresh tokens
        await user.save();

        await redis.del(`sessionId:${sessionId}`) // delete current session 

        const newSessionId = await generateSessionId(user._id, user.refreshTokenVersion) // create new session for the user
        const token = jwt.sign({ userId: user._id, sessionId: newSessionId }, process.env.JWT_SECRET, { expiresIn: "15m" })


        res.status(200).json({ message: 'Password changed successfully' , newSessionId, token });
    } catch (error) {
        next(error)
    }
}

//WIP: will have to delete related fields later on 
export const deleteAccount = async (req, res, next) => { // hard delete for full cleared data 
    try {
        const { user } = req;
        const sessionId = req.sessionId;

        const deletedUser = await User.findByIdAndDelete(user._id);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        await redis.del(`sessionId:${sessionId}`) // delete session from redis to invalidate the refresh token
        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        next(error)
    }
}

export const disableAccount = async (req, res, next) => {
    try {
        const { user } = req;
        const sessionId = req.sessionId;

        await User.findByIdAndUpdate(user._id, { isDisabled: true, refreshTokenVersion: user.refreshTokenVersion + 1, expoPushToken: "" }); // soft disable user and remove expo push token to stop notifications
        await redis.del(`sessionId:${sessionId}`) // delete session from redis to invalidate the refresh token
        res.status(200).json({ message: 'Account disabled successfully' });
    } catch (error) {
        next(error)
    }
}

export const enableAccount = async (req, res, next) => {
    try {
        const { user } = req;
        const sessionId = req.sessionId;

        await User.findByIdAndUpdate(user._id, { isDisabled: false, refreshTokenVersion: user.refreshTokenVersion + 1, expoPushToken: "" }); // soft enable user and remove expo push token to stop notifications
        await redis.del(`sessionId:${sessionId}`) // delete session from redis to invalidate the refresh token
        res.status(200).json({ message: 'Account enabled successfully' });
    } catch (error) {
        next(error)
    }
}
