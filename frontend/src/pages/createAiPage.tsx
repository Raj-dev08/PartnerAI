import { useState } from "react";
import { motion } from "framer-motion";
import { useAiBuilderStore } from "../store/useAi";

type Errors = Record<string, string>;

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function CreateAiPage() {
  const { createAiModel, loading } = useAiBuilderStore();

  const [errors, setErrors] = useState<Errors>({});

  const [form, setForm] = useState({
    maleName: "",
    femaleName: "",
    otherName: "",
    age: "",
    aiType: "",
    description: "",
    expressiveness: 5,
    talkativeness: 5,
    trustBuildingRate: 5,
    personalityTraits: {
      humour: 5,
      kindness: 5,
      sarcasm: 5,
      coldness: 5,
      confidence: 5,
      newGen: 5,
      sweetness: 5,
    },
    speechPatterns: {
      slangUsage: 5,
      formalityLevel: 5,
      typingStyle: "normal",
      catchphrases: ""
    },
    birthDate: "",
    birthMonth: "January",
    occupation: "",
    occupationWeightage: "",
    academicBackground: "",
    academicBackgroundWeightage: "",
  });

  const validate = () => {
    const newErrors: Errors = {};

    if (!form.maleName) newErrors.maleName = "Required";
    if (!form.femaleName) newErrors.femaleName = "Required";
    if (!form.otherName) newErrors.otherName = "Required";

    if(form.speechPatterns.catchphrases){
      const arr = form.speechPatterns.catchphrases.split(",")
      if (arr.length > 5) newErrors.catchphrases = "Max 5 catchphrases";
      for (const a of arr) {
        if (a.length > 40) newErrors.catchphrases = "Each must be < 40 chars";
      }
    }

    if (!form.aiType) newErrors.aiType = "Required";
    if (form.aiType.length > 20) newErrors.aiType = "Max 20 chars";

    if (isNaN(Number(form.age))) newErrors.age = "Must be number";
    if (Number(form.age) > 50 || Number(form.age) < -50) newErrors.age = "-50 to 50";

    if (Number(form.birthDate) < 1 || Number(form.birthDate) > 28)
      newErrors.birthDate = "1-28 only";

    if (
      Number(form.occupationWeightage) < 0 ||
      Number(form.occupationWeightage) > 10
    )
      newErrors.occupationWeightage = "0-10 only";

    if (
      Number(form.academicBackgroundWeightage) < 0 ||
      Number(form.academicBackgroundWeightage) > 10
    )
      newErrors.academicBackgroundWeightage = "0-10 only";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        ["age", "occupationWeightage", "academicBackgroundWeightage"].includes(name)
          ? Number(value)
          : value,
    }));
  };

  const handleChangeForCatchPhrase = (e :any) => {
    const { value } = e.target;
    setForm((prev:any) => {
        const newState = { ...prev };

        newState.speechPatterns = {
          ...newState.speechPatterns,
          catchphrases: value
        }

        return newState;
    });
  }

  const handleChangeForNumbers = (e: any) => {
    const { name, value } = e.target;
    const regex = name === "age" ? /^-?\d*$/ : /^\d*$/;

      if (value === "" || regex.test(value)) {
        setForm((prev) => ({
          ...prev,
          [name]: value, 
        }));
      }
      return;
  }

  const handleSlider = (path: string, value: number | string) => {
    setForm((prev: any) => {
      const newState = { ...prev };

      if (path.includes(".")) {
        const [parent, child] = path.split(".");
        newState[parent] = {
          ...newState[parent],
          [child]: value,
        };
      } else {
        newState[path] = value;
      }

      return newState;
    });
  };

  const handleSubmit = async () => {
    const payLoad = {
        ...form,
        age: Number(form.age),
        birthDate: Number(form.birthDate),
        occupationWeightage: Number(form.occupationWeightage),
        academicBackgroundWeightage: Number(form.academicBackgroundWeightage),
        speechPatterns: {
          ...form.speechPatterns,
          catchPhrases: form.speechPatterns.catchphrases.split(",")
        }
    }
    if(!validate()) return;

    await createAiModel(payLoad);
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-sm focus:outline-none focus:ring-1 focus:ring-white/30";

  const labelClass = "text-xs text-neutral-500 flex justify-between";

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* HEADER */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-2">
          <h1 className="text-3xl font-semibold">Create AI</h1>
          <p className="text-neutral-500 text-sm">Define personality, behavior & background</p>
        </motion.div>

        {/* BASIC */}
        <div className="space-y-5">
          <h2 className="text-sm text-neutral-400 uppercase">Basic</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ["maleName","Male Name"],
              ["femaleName","Female Name"],
              ["otherName","Other Name"],
              ["aiType","AI Type (max 20 chars)"]
            ].map(([field,label]) => (
              <div key={field}>
                <label className={labelClass}>
                  <span>{label}</span>
                  {field === "aiType" && (
                    <span>{form.aiType.length}/20</span>
                  )}
                </label>
                <input
                  name={field}
                  value={(form as any)[field]}
                  onChange={handleChange}
                  maxLength={field === "aiType" ? 20 : undefined}
                  className={inputClass}
                />
                {errors[field] && (
                    <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className={labelClass}>
              <span>Age Difference</span>
              <span>-50 to 50</span>
            </label>
            <input name="age" type="text" value={form.age} onChange={handleChangeForNumbers} className={inputClass}/>
          </div>

          <div>
            <label className={labelClass}>
              <span>Description</span>
              <span>Optional</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={200}
              className={inputClass}
            />
          </div>


          <div>
            <label className={labelClass}>
              <span>CatchPhrases (seperated by commas ',' )</span>
              <span>Optional</span>
            </label>
            <textarea
              value={form.speechPatterns.catchphrases}
              onChange={handleChangeForCatchPhrase}
              maxLength={200}
              className={inputClass}
            />

            {errors.catchphrases && (
              <p className="text-red-500 text-xs mt-1">{errors.catchphrases}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}><span>Birth Date</span><span>1-28</span></label>
              <input
              type="text"
              value={form.birthDate}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || ( /^\d*$/.test(val) && Number(val) >= 1 && Number(val) <= 28)) {
                  setForm((p) => ({
                    ...p,
                    birthDate: val,
                  }));
                }
              }}
              className={inputClass}
            />
            </div>

            <div>
              <label className={labelClass}>Month</label>
              <select
                value={form.birthMonth}
                onChange={(e) =>
                  setForm((p) => ({ ...p, birthMonth: e.target.value }))
                }
                className={inputClass}
              >
                {months.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* BACKGROUND */}
        <div className="space-y-5">
          <h2 className="text-sm text-neutral-400 uppercase">Background</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}><span>Occupation</span><span>Optional</span></label>
              <input name="occupation" value={form.occupation} onChange={handleChange} className={inputClass}/>
            </div>

            <div>
              <label className={labelClass}><span>Weight</span><span>0-10</span></label>
              <input name="occupationWeightage" type="text" value={form.occupationWeightage} onChange={handleChangeForNumbers} className={inputClass}/>
            </div>

            <div>
              <label className={labelClass}><span>Academic</span><span>Optional</span></label>
              <input name="academicBackground" value={form.academicBackground} onChange={handleChange} className={inputClass}/>
            </div>

            <div>
              <label className={labelClass}><span>Weight</span><span>0-10</span></label>
              <input name="academicBackgroundWeightage" type="text" value={form.academicBackgroundWeightage} onChange={handleChangeForNumbers} className={inputClass}/>
            </div>
          </div>
        </div>

        {/* PERSONALITY */}
        <div className="space-y-5">
          <h2 className="text-sm text-neutral-400 uppercase">Personality (0–10)</h2>

          {Object.entries(form.personalityTraits).map(([k, v]) => (
            <div key={k}>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>{k}</span>
                <span>{v}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={v}
                onChange={(e) =>
                  handleSlider(`personalityTraits.${k}`, Number(e.target.value))
                }
                className="w-full"
              />
            </div>
          ))}
        </div>

        {/* SPEECH */}
        <div className="space-y-5">
          <h2 className="text-sm text-neutral-400 uppercase">Speech</h2>

          {["slangUsage","formalityLevel"].map((k) => (
            <div key={k}>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>{k}</span>
                <span>{(form.speechPatterns as any)[k]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={(form.speechPatterns as any)[k]}
                onChange={(e) =>
                  handleSlider(`speechPatterns.${k}`, Number(e.target.value))
                }
                className="w-full"
              />
            </div>
          ))}

          <select
            value={form.speechPatterns.typingStyle}
            onChange={(e) =>
              handleSlider("speechPatterns.typingStyle", String(e.target.value))
            }
            className={inputClass}
          >
            <option value="normal">Normal</option>
            <option value="emoji-heavy">Emoji heavy</option>
            <option value="lowercase">Lowercase</option>
            <option value="short-messages">Short</option>
          </select>
        </div>

        {/* BEHAVIOR */}
        <div className="space-y-5">
          <h2 className="text-sm text-neutral-400 uppercase">Behavior (0–10)</h2>

          {["expressiveness","talkativeness","trustBuildingRate"].map((k) => (
            <div key={k}>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>{k}</span>
                <span>{(form as any)[k]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={(form as any)[k]}
                onChange={(e) =>
                  handleSlider(k, Number(e.target.value))
                }
                className="w-full"
              />
            </div>
          ))}
        </div>

        {/* BUTTON */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-white text-black rounded-lg text-sm font-medium"
        >
          {loading ? "Creating..." : "Create AI"}
        </motion.button>

      </div>
    </div>
  );
}
