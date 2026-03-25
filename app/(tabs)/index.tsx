import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View, Button, Vibration, Keyboard, Pressable } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { ThemedText } from '@/components/themed-text';

export default function HomeScreen() {
  // Distance from you to the tree (horizontal) in meters
  const [distance, setDistance] = useState<string>('10');
  // Phone tilt angle in degrees
  const [angleDeg, setAngleDeg] = useState(0);
  const [isMeasuring, setIsMeasuring] = useState(true);
  const [hasVibratedAtZero, setHasVibratedAtZero] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedAngleDeg, setLockedAngleDeg] = useState<number | null>(null);
  const [lockedHeightM, setLockedHeightM] = useState<number | null>(null);
  const lastTapMsRef = useRef<number>(0);

  const lockReading = () => {
    setLockedAngleDeg(angleDeg);
    setLockedHeightM(height);
    setIsLocked(true);
    setIsMeasuring(false);
  };

  const resetReading = () => {
    setIsLocked(false);
    setLockedAngleDeg(null);
    setLockedHeightM(null);
    setHasVibratedAtZero(false);
    setIsMeasuring(true);
  };

  useEffect(() => {
    let subscription: any;

    if (isMeasuring) {
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const angleRad = Math.atan2(y, Math.sqrt(x * x + z * z));
        const angle = (-angleRad * 180) / Math.PI;
        setAngleDeg(angle);

        // If angle is close to level (e.g. within 1° of 0), vibrate once
        const isLevel = Math.abs(angle) < 1;

        if (isLevel && !hasVibratedAtZero) {
          Vibration.vibrate(50); // short buzz
          setHasVibratedAtZero(true);
        } else if (!isLevel && hasVibratedAtZero) {
          // Reset once they move away from level so we can buzz again next time
          setHasVibratedAtZero(false);
        }
      });

      Accelerometer.setUpdateInterval(200); // update every 200 ms
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isMeasuring, hasVibratedAtZero]);

  const distanceNumber = parseFloat(distance) || 0;
  const angleRad = (angleDeg * Math.PI) / 180;
  // Basic trig: height = distance * tan(angle)
  const height = distanceNumber * Math.tan(angleRad);

  const displayAngleDeg = isLocked && lockedAngleDeg != null ? lockedAngleDeg : angleDeg;
  const displayHeightM = isLocked && lockedHeightM != null ? lockedHeightM : height;

  const formattedHeight =
    Number.isFinite(displayHeightM) && Math.abs(displayHeightM) < 1000 ? displayHeightM.toFixed(1) : '--';

  return (
    <Pressable
      style={styles.container}
      onPress={() => {
        const now = Date.now();
        const delta = now - lastTapMsRef.current;
        lastTapMsRef.current = now;

        if (delta < 300) {
          if (isLocked) resetReading();
          else lockReading();
        }
      }}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Tree Height Clinometer
        </ThemedText>

        <ThemedText style={styles.instructions}>
          1. Stand a known horizontal distance from the tree.
        </ThemedText>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={distance}
          onChangeText={setDistance}
          placeholder="Distance to tree (meters)"
          placeholderTextColor="#B8B8B8"
          returnKeyType="done"
          blurOnSubmit
          editable={!isLocked}
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        <ThemedText style={styles.instructions}>
          2. Hold the phone horizontally (on its side) and aim the top edge at the top of the tree.
        </ThemedText>

        <ThemedText style={styles.value}>Angle: {displayAngleDeg.toFixed(1)}°</ThemedText>

        <ThemedText style={styles.value}>
          Estimated tree height above phone: {formattedHeight} m
        </ThemedText>

        <ThemedText style={styles.note}>
          (Add your eye/phone height to get total tree height from ground.)
        </ThemedText>

        <ThemedText style={styles.hint}>
          Double-tap anywhere to {isLocked ? 'reset' : 'lock'} the reading.
        </ThemedText>

        <View style={styles.smallButtonsRow}>
          <Button
            title={isMeasuring ? 'Pause sensor' : 'Resume sensor'}
            onPress={() => setIsMeasuring((prev) => !prev)}
            disabled={isLocked}
          />
        </View>
      </View>

      {isLocked ? (
        <Pressable style={styles.resetPill} onPress={resetReading}>
          <ThemedText style={styles.resetPillText}>Reset</ThemedText>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    gap: 16,
    paddingTop: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#FFFFFF',
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  hint: {
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  smallButtonsRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  resetPill: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#DC2626',
  },
  resetPillText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
