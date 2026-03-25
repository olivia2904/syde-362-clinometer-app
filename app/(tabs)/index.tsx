import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View, Vibration, Keyboard, Pressable } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Tree Height Clinometer
          </ThemedText>
          <ThemedText style={styles.subtitle}>Measure tree heights with precision</ThemedText>
        </View>

        <View style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.stepNumberCircle}>
              <ThemedText style={styles.stepNumberText}>1</ThemedText>
            </View>
            <ThemedText style={styles.stepText}>Stand a known horizontal distance from the tree.</ThemedText>
          </View>

          <ThemedText style={styles.fieldLabel}>DISTANCE (METERS)</ThemedText>
          <View style={styles.inputShell}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={distance}
              onChangeText={setDistance}
              placeholder="10"
              placeholderTextColor="#B8B8B8"
              returnKeyType="done"
              blurOnSubmit
              editable={!isLocked}
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.stepNumberCircle}>
              <ThemedText style={styles.stepNumberText}>2</ThemedText>
            </View>
            <ThemedText style={styles.stepText}>
              Hold the phone horizontally (on its side) and aim the top edge at the top of the tree.
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, isLocked && styles.metricCardLocked]}>
            <ThemedText style={[styles.metricLabel, isLocked && styles.metricLabelLocked]}>ANGLE</ThemedText>
            <ThemedText style={[styles.metricValue, isLocked && styles.metricValueLocked]}>
              {displayAngleDeg.toFixed(1)}°
            </ThemedText>
          </View>

          <View style={[styles.metricCard, isLocked && styles.metricCardLocked]}>
            <ThemedText style={[styles.metricLabel, isLocked && styles.metricLabelLocked]}>HEIGHT</ThemedText>
            <ThemedText style={[styles.metricValue, isLocked && styles.metricValueLocked]}>
              {formattedHeight} m
            </ThemedText>
          </View>
        </View>

        <View style={styles.noteCard}>
          <ThemedText style={styles.noteText}>
            (Add your eye/phone height to get total tree height from ground.)
          </ThemedText>
        </View>

        <View style={[styles.lockHintBar, isLocked && styles.lockHintBarLocked]}>
          <View style={styles.lockIconCircle}>
            <ThemedText style={styles.lockIconText}>L</ThemedText>
          </View>
          <ThemedText style={styles.lockHintText}>
            {isLocked ? 'Reading locked (double-tap to unlock)' : 'Double-tap anywhere to lock the reading'}
          </ThemedText>
        </View>
        </View>
      </SafeAreaView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#05302E',
  },
  safeArea: {
    flex: 1,
    paddingTop: 64,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  screen: {
    flex: 1,
    gap: 12,
    justifyContent: 'flex-start',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
    fontSize: 14,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: 'rgba(17, 32, 62, 0.55)',
    borderRadius: 16,
    padding: 16,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    color: '#E5E7EB',
    opacity: 0.95,
  },
  fieldLabel: {
    marginTop: 14,
    fontSize: 12,
    opacity: 0.8,
    letterSpacing: 0.5,
  },
  inputShell: {
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },

  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderRadius: 14,
    padding: 14,
  },
  metricCardLocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  metricLabel: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.75,
    letterSpacing: 0.6,
  },
  metricLabelLocked: {
    opacity: 0.95,
    color: '#34D399',
  },
  metricValue: {
    marginTop: 6,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metricValueLocked: {
    color: '#34D399',
  },

  noteCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderRadius: 12,
    padding: 12,
  },
  noteText: {
    fontSize: 12,
    opacity: 0.8,
    fontStyle: 'italic',
  },

  lockHintBar: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(161, 98, 39, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  lockHintBarLocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  lockIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIconText: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '800',
  },
  lockHintText: {
    flex: 1,
    color: '#FDE68A',
    opacity: 0.95,
    fontSize: 13,
  },

});
