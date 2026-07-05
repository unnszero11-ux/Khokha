import admin from "firebase-admin";
import fs from "fs";

const configPath = "./firebase-applet-config.json";
if (fs.existsSync(configPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
  
  async function test() {
    try {
      const users = await admin.auth().listUsers();
      console.log("Success! users:", users.users.length);
    } catch (err: any) {
      console.error("Failed:", err.message);
    }
  }
  
  test();
}
