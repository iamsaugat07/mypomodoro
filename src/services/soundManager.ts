import { Audio } from "expo-av";

let sounds: Map<string, Audio.Sound> = new Map();
let enabled: boolean = true;
let volume: number = 1.0;
const MAX_DURATION_MS = 2000; // 2 seconds max

export const initializeSounds = async (): Promise<void> => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    await loadSound("start", require("../../assets/sounds/start.mp3"));
    await loadSound(
      "workComplete",
      require("../../assets/sounds/work-complete.mp3")
    );
    await loadSound(
      "breakComplete",
      require("../../assets/sounds/work-complete.mp3")
    );

    console.log("Sound manager initialized");
  } catch (error) {
    console.error("Failed to initialize sound manager:", error);
  }
};

const loadSound = async (key: string, source: any): Promise<void> => {
  try {
    const { sound } = await Audio.Sound.createAsync(source);
    await sound.setVolumeAsync(volume);
    sounds.set(key, sound);
  } catch (error) {
    console.error(`Failed to load sound ${key}:`, error);
  }
};

export const playStartSound = async (): Promise<void> => {
  await playSound("start");
};

export const playWorkCompleteSound = async (): Promise<void> => {
  await playSound("workComplete");
};

export const playBreakCompleteSound = async (): Promise<void> => {
  await playSound("breakComplete");
};

const playSound = async (key: string): Promise<void> => {
  if (!enabled) return;

  try {
    const sound = sounds.get(key);
    if (!sound) return;

    // Stop if already playing
    await sound.stopAsync();
    await sound.setPositionAsync(0);

    // Play the sound
    await sound.playAsync();

    // Auto-stop after 2 seconds
    setTimeout(async () => {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.stopAsync();
          await sound.setPositionAsync(0);
        }
      } catch (error) {
        console.error("Error stopping sound:", error);
      }
    }, MAX_DURATION_MS);
  } catch (error) {
    console.error(`Failed to play sound ${key}:`, error);
  }
};

export const setSoundsEnabled = (isEnabled: boolean): void => {
  enabled = isEnabled;
};

export const setSoundsVolume = async (newVolume: number): Promise<void> => {
  volume = Math.max(0, Math.min(1, newVolume));

  for (const sound of sounds.values()) {
    await sound.setVolumeAsync(volume);
  }
};

export const cleanupSounds = async (): Promise<void> => {
  for (const sound of sounds.values()) {
    await sound.unloadAsync();
  }
  sounds.clear();
};
