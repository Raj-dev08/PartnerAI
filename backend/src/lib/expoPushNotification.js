export const sendNotificationToExpo = async (token, payload) => {
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: token,
        title: payload.title,
        body: payload.body,

        priority: "high",
        sound: "default",
        channelId: "default_v2",

        android: {
          channelId: "default_v2",
          priority: "high",
          sound: "default",
          vibrate: [0, 1000, 500, 1000],
        },

        data: payload.data || {},
      }),
    });
  } catch (err) {
    console.error("Expo push error:", err);
  }
};