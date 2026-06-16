import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Platform, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Card, 
  Text, 
  Button, 
  ProgressBar, 
  Avatar, 
  IconButton, 
  Divider, 
  useTheme 
} from 'react-native-paper';
import { Spacing } from '@/constants/theme';
import type { UserProfile, LogEntry } from '@earthprint/types';

// Biophilic color palette tokens
const BIOPHILIC_COLORS = {
  earthDark: '#1a2e1a',
  earthDeep: '#1f3825',
  forestBase: '#2d5a3d',
  forestMid: '#3d7a52',
  forestLight: '#5a9e6f',
  moss: '#7ab88a',
  leaf: '#9dd4a8',
  clay: '#c4855a',
  amber: '#e8a842',
  teal: '#2aa8a8',
  tealLight: '#4ecdc4',
  twilight: '#2a1f3d',
  success: '#4caf7d',
  danger: '#e85a42',
  white: '#ffffff',
};

type BiomeType = 'forest' | 'reef' | 'meadow';

interface BiomeDetails {
  name: string;
  emoji: string;
  bgGlow: string;
  statusGood: string;
  statusStressed: string;
  description: string;
}

const BIOME_DATA: Record<BiomeType, BiomeDetails> = {
  forest: {
    name: 'Temperate Forest',
    emoji: '🌲🦊🦌🏕️💧',
    bgGlow: '#1f3825',
    statusGood: 'River running clear and blue · Canopy lush & green',
    statusStressed: 'Smoke haze visible · River levels low',
    description: 'Ancient trees & flowing rivers',
  },
  reef: {
    name: 'Coral Reef',
    emoji: '🪸🐠🐙🐚🌊',
    bgGlow: '#1a6b6b',
    statusGood: 'Vibrant anemone polyps · Crystal clear waters',
    statusStressed: 'Slight bleaching visible · Algae cover rising',
    description: 'Vibrant underwater life',
  },
  meadow: {
    name: 'Alpine Meadow',
    emoji: '🌸🐝🦋⛰️🐐',
    bgGlow: '#2a1f3d',
    statusGood: 'Wildflowers in full bloom · Mountain streams running fresh',
    statusStressed: 'Flowers wilting · Dry soil patches',
    description: 'Wildflowers & mountain streams',
  },
};

const MOCK_PROFILE: UserProfile = {
  uid: 'user-123',
  email: 'nurturer@terrapulse.org',
  displayName: 'Alex Rivers',
  photoURL: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  onboardingCompleted: true,
  points: 1840,
  streakDays: 18,
  terraScore: 74, // Added terraScore
  lastLogDate: new Date().toISOString(),
  graceUsedThisWeek: false,
  preferredUnits: 'metric',
  notificationsEnabled: true,
  locale: 'en',
  isPublicProfile: true,
};

const MOCK_LOGS: LogEntry[] = [
  {
    id: 'log-1',
    uid: 'user-123',
    category: 'travel',
    kgCo2e: 1.8,
    loggedAt: new Date().toISOString(),
    activityDate: new Date().toISOString(),
    notes: 'Morning office commute',
    source: 'manual',
    data: { mode: 'train-local', distanceKm: 15 },
  },
  {
    id: 'log-2',
    uid: 'user-123',
    category: 'food',
    kgCo2e: 0.6,
    loggedAt: new Date().toISOString(),
    activityDate: new Date().toISOString(),
    notes: 'Plant-based lunch bowl',
    source: 'manual',
    data: { foodType: 'legumes', weightGrams: 250, isOrganic: false, isLocal: false, wasWasted: false },
  },
  {
    id: 'log-3',
    uid: 'user-123',
    category: 'energy',
    kgCo2e: 5.4,
    loggedAt: new Date().toISOString(),
    activityDate: new Date().toISOString(),
    notes: 'Utility electricity bill',
    source: 'ocr',
    data: { source: 'grid-electricity', amount: 12, unit: 'kwh' },
  },
];

export default function HomeScreen() {
  const paperTheme = useTheme();
  const [activeBiome, setActiveBiome] = useState<BiomeType>('forest');
  const [terraScore, setTerraScore] = useState<number>(74); // Heartbeat score 0-100
  const biome = BIOME_DATA[activeBiome];

  // Determine biome health based on Terra Score
  const isHealthy = terraScore >= 60;
  const healthStatusText = isHealthy ? 'Healthy' : 'Stressed';
  const healthStatusColor = isHealthy ? BIOPHILIC_COLORS.success : BIOPHILIC_COLORS.danger;
  const biomeStatusDetails = isHealthy ? biome.statusGood : biome.statusStressed;

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Section */}
        <SafeAreaView edges={['top']} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.logoText}>
                🌿 Earth<Text style={{ color: BIOPHILIC_COLORS.tealLight }}>Print</Text>
              </Text>
              <Text style={styles.subtitleText}>Nurture Your Ecosystem</Text>
            </View>
            <Avatar.Text 
              size={40} 
              label="AR" 
              style={{ backgroundColor: BIOPHILIC_COLORS.forestMid }} 
              labelStyle={{ color: BIOPHILIC_COLORS.leaf }}
            />
          </View>
        </SafeAreaView>

        {/* Biome Viewport Card */}
        <Card style={[styles.biomeCard, { backgroundColor: biome.bgGlow }]} elevation={4}>
          <Card.Content>
            <View style={styles.biomeHeader}>
              <View style={styles.healthBadge}>
                <View style={[styles.pulseDot, { backgroundColor: healthStatusColor }]} />
                <Text style={styles.healthBadgeText}>Health: {healthStatusText}</Text>
              </View>
              <Text style={styles.biomeName}>{biome.name}</Text>
            </View>

            {/* Visual Ecosystem Avatar */}
            <View style={styles.ecosystemViewport}>
              <Text style={styles.ecosystemEmojis}>{biome.emoji}</Text>
              <Text style={styles.ecosystemStatusText}>{biomeStatusDetails}</Text>
            </View>

            <View style={styles.biomeSelector}>
              {(Object.keys(BIOME_DATA) as BiomeType[]).map((type) => (
                <Button 
                  key={type}
                  mode={activeBiome === type ? 'contained' : 'outlined'}
                  compact
                  onPress={() => setActiveBiome(type)}
                  style={[styles.selectorButton, { borderColor: BIOPHILIC_COLORS.forestLight }]}
                  buttonColor={activeBiome === type ? BIOPHILIC_COLORS.forestLight : undefined}
                  textColor={activeBiome === type ? BIOPHILIC_COLORS.white : BIOPHILIC_COLORS.leaf}
                >
                  {type === 'forest' ? '🌲 Forest' : type === 'reef' ? '🪸 Reef' : '🌸 Meadow'}
                </Button>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Terra Score Ring Widget */}
          <Card style={styles.statCard}>
            <Card.Content style={styles.centerAlign}>
              <Text style={styles.statLabel}>Terra Score</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreValue}>{terraScore}</Text>
                <Text style={styles.scoreMax}>/ 100</Text>
              </View>
              <Text style={styles.tierName}>Ancient Oak</Text>
              <Text style={styles.tierLevel}>Guardian · Level 4</Text>
            </Card.Content>
          </Card>

          {/* Streak & Points Widget */}
          <Card style={styles.statCard}>
            <Card.Content style={styles.centerAlign}>
              <Text style={styles.statLabel}>Bloom Points</Text>
              <Text style={styles.pointsValue}>{MOCK_PROFILE.points.toLocaleString()}</Text>
              
              <Divider style={styles.statsDivider} />
              
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={styles.streakValue}>🔥 {MOCK_PROFILE.streakDays} days</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Budget Bar */}
        <Card style={styles.budgetCard}>
          <Card.Content>
            <View style={styles.budgetHeader}>
              <Text style={styles.cardSectionTitle}>Carbon Budget Usage</Text>
              <Text style={styles.budgetValue}>82 kg / 208 kg</Text>
            </View>
            <ProgressBar 
              progress={82 / 208} 
              color={BIOPHILIC_COLORS.tealLight} 
              style={styles.progressBar} 
            />
            <Text style={styles.budgetHelp}>39% used · 126 kg remaining this month</Text>
          </Card.Content>
        </Card>

        {/* Recent Activity Log */}
        <Card style={styles.logsCard}>
          <Card.Content>
            <Text style={styles.cardSectionTitle}>Recent Logs</Text>
            <Divider style={styles.sectionDivider} />
            
            {MOCK_LOGS.map((log) => {
              const icon = log.category === 'travel' ? 'car' : log.category === 'food' ? 'food-apple' : 'flash';
              const color = log.category === 'travel' ? '#3B82F6' : log.category === 'food' ? '#10B981' : '#F59E0B';
              return (
                <View key={log.id} style={styles.logRow}>
                  <IconButton 
                    icon={icon} 
                    iconColor={color} 
                    size={24} 
                    style={[styles.logIcon, { backgroundColor: color + '15' }]} 
                  />
                  <View style={styles.logInfo}>
                    <Text style={styles.logSource}>{log.notes || 'Activity Log'}</Text>
                    <Text style={styles.logCategory}>{log.category.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.logCo2}>{log.kgCo2e.toFixed(1)} kg CO₂e</Text>
                </View>
              );
            })}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: BIOPHILIC_COLORS.earthDark,
  },
  scrollContainer: {
    paddingBottom: Spacing.six,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  logoText: {
    fontFamily: Platform.OS === 'ios' ? 'Fraunces' : 'serif',
    fontSize: 24,
    fontWeight: 'bold',
    color: BIOPHILIC_COLORS.white,
  },
  subtitleText: {
    fontSize: 12,
    color: BIOPHILIC_COLORS.moss,
  },
  biomeCard: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.four,
    borderRadius: 24,
    overflow: 'hidden',
  },
  biomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  biomeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BIOPHILIC_COLORS.white,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  healthBadgeText: {
    fontSize: 11,
    color: BIOPHILIC_COLORS.white,
    fontWeight: '600',
  },
  ecosystemViewport: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    minHeight: 120,
  },
  ecosystemEmojis: {
    fontSize: 36,
    letterSpacing: 8,
    marginBottom: Spacing.four,
  },
  ecosystemStatusText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  biomeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  selectorButton: {
    flex: 1,
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
    gap: Spacing.four,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(90,158,111,0.15)',
  },
  centerAlign: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: BIOPHILIC_COLORS.moss,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.two,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: BIOPHILIC_COLORS.white,
    lineHeight: 38,
  },
  scoreMax: {
    fontSize: 12,
    color: BIOPHILIC_COLORS.moss,
    marginLeft: 2,
    marginBottom: 4,
  },
  tierName: {
    fontSize: 13,
    fontWeight: '600',
    color: BIOPHILIC_COLORS.tealLight,
  },
  tierLevel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  pointsValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: BIOPHILIC_COLORS.amber,
  },
  statsDivider: {
    width: '80%',
    marginVertical: Spacing.three,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  streakValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BIOPHILIC_COLORS.success,
  },
  budgetCard: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.four,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(90,158,111,0.15)',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BIOPHILIC_COLORS.white,
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BIOPHILIC_COLORS.white,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  budgetHelp: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: Spacing.two,
  },
  logsCard: {
    marginHorizontal: Spacing.four,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(90,158,111,0.15)',
  },
  sectionDivider: {
    marginVertical: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  logIcon: {
    margin: 0,
    borderRadius: 12,
  },
  logInfo: {
    flex: 1,
    marginLeft: Spacing.two,
  },
  logSource: {
    fontSize: 13,
    fontWeight: '500',
    color: BIOPHILIC_COLORS.white,
  },
  logCategory: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  logCo2: {
    fontSize: 13,
    fontWeight: 'bold',
    color: BIOPHILIC_COLORS.white,
  },
});
