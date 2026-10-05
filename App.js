// minor comment addition

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import * as Brightness from 'expo-brightness';

void SplashScreen.preventAutoHideAsync();

import * as React from 'react';
import { View, FlatList, ScrollView, Image, Alert } from 'react-native';

import {
  Provider as PaperProvider,
  Appbar,
  TextInput,
  Text,
  FAB,
  BottomNavigation,
  Avatar,
  List,
  Card,
  Dialog,
  Portal,
  RadioButton,
  Button,
  Snackbar,
  Menu,
  Switch,
  MD3LightTheme as DefaultTheme,
} from 'react-native-paper';

import { NavigationContainer, useFocusEffect } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { initialPeople } from './data/people';
import { announcements } from './data/announcements';

import {
  validatePerson,
  isDuplicatePerson,
  validateAndCheckDuplicate,
} from './personValidation';

// ============================================================
// CONSTANTS
// ============================================================

const PEOPLE_STORAGE_KEY = '@roi_people';
const SOUND_STORAGE_KEY = '@roi_sound_enabled';
const PREFERENCES_STORAGE_KEY = '@roi_preferences';

// ============================================================
// PEOPLE CONTEXT
// ============================================================

const PeopleContext = React.createContext(null);

function PeopleProvider({ children }) {
  const [people, setPeople] = React.useState(initialPeople);
  const [loading, setLoading] = React.useState(true);

  // Load saved people when the app starts
  React.useEffect(() => {
    const loadPeople = async () => {
      try {
        const storedPeople = await AsyncStorage.getItem(PEOPLE_STORAGE_KEY);

        if (storedPeople !== null) {
          setPeople(JSON.parse(storedPeople));
        }
      } catch (error) {
        console.error('Failed to load people:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPeople();
  }, []);

  // Save people whenever they change
  React.useEffect(() => {
    if (loading) {
      return;
    }

    const savePeople = async () => {
      try {
        await AsyncStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people));
      } catch (error) {
        console.error('Failed to save people:', error);
      }
    };

    savePeople();
  }, [people, loading]);

  if (loading) {
    return null;
  }

  return (
    <PeopleContext.Provider
      value={{
        people,
        setPeople,
      }}>
      {children}
    </PeopleContext.Provider>
  );
}

// ============================================================
// SOUND CONTEXT
// ============================================================

const SoundContext = React.createContext(null);

function SoundProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  const successPlayer = useAudioPlayer(require('./assets/sounds/success.mp3'));

  const errorPlayer = useAudioPlayer(require('./assets/sounds/error.mp3'));

  const tapPlayer = useAudioPlayer(require('./assets/sounds/tap.mp3'));

  // Load sound preference
  React.useEffect(() => {
    const loadSoundSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SOUND_STORAGE_KEY);

        if (stored !== null) {
          setSoundEnabled(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load sound setting:', error);
      }
    };

    loadSoundSettings();
  }, []);

  // Save sound preference
  const updateSoundEnabled = async (enabled) => {
    setSoundEnabled(enabled);

    try {
      await AsyncStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.error('Failed to save sound setting:', error);
    }
  };

  const playSuccess = () => {
    if (!soundEnabled) {
      return;
    }

    successPlayer.seekTo(0);
    successPlayer.play();
  };

  const playError = () => {
    if (!soundEnabled) {
      return;
    }

    errorPlayer.seekTo(0);
    errorPlayer.play();
  };

  const playTap = () => {
    if (!soundEnabled) {
      return;
    }

    tapPlayer.seekTo(0);
    tapPlayer.play();
  };

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        updateSoundEnabled,
        playSuccess,
        playError,
        playTap,
      }}>
      {children}
    </SoundContext.Provider>
  );
}

// ============================================================
// PREFERENCES CONTEXT
// ============================================================

const PreferencesContext = React.createContext(null);

function PreferencesProvider({ children }) {
  const [fontScale, setFontScale] = React.useState(1);
  const [brightness, setBrightness] = React.useState(0.7);

  // Load saved preferences
  React.useEffect(() => {
    const loadPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);

        if (stored !== null) {
          const preferences = JSON.parse(stored);

          if (preferences.fontScale !== undefined) {
            setFontScale(preferences.fontScale);
          }

          if (preferences.brightness !== undefined) {
            setBrightness(preferences.brightness);
          }
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Update text size
  const updateFontScale = async (value) => {
    setFontScale(value);

    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);

      const preferences = stored !== null ? JSON.parse(stored) : {};

      await AsyncStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({
          ...preferences,
          fontScale: value,
        })
      );
    } catch (error) {
      console.error('Failed to save font scale:', error);
    }
  };

  // Update brightness
  const updateBrightness = async (value) => {
    setBrightness(value);

    try {
      // Change device/app screen brightness
      await Brightness.setBrightnessAsync(value);

      const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);

      const preferences = stored !== null ? JSON.parse(stored) : {};

      await AsyncStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({
          ...preferences,
          brightness: value,
        })
      );
    } catch (error) {
      console.error('Failed to update brightness:', error);
    }
  };

  return (
    <PreferencesContext.Provider
      value={{
        fontScale,
        updateFontScale,
        brightness,
        updateBrightness,
      }}>
      {children}
    </PreferencesContext.Provider>
  );
}

// ============================================================
// LOGO
// ============================================================

const LogoTitle = () => (
  <Image
    source={require('./assets/ROI_logo.png')}
    style={{
      width: 80,
      height: 42,
      resizeMode: 'contain',
      marginLeft: 10,
      marginRight: 20,
    }}
  />
);

// ============================================================
// DROPDOWN OPTIONS
// ============================================================

const stateOptions = [
  { label: 'NSW', value: 'NSW' },
  { label: 'VIC', value: 'VIC' },
  { label: 'QLD', value: 'QLD' },
  { label: 'SA', value: 'SA' },
  { label: 'WA', value: 'WA' },
  { label: 'TAS', value: 'TAS' },
  { label: 'NT', value: 'NT' },
  { label: 'ACT', value: 'ACT' },
];

const departmentOptions = [
  { label: 'Department 1', value: 1 },
  { label: 'Department 2', value: 2 },
  { label: 'Department 3', value: 3 },
];

const permissionOptions = [
  {
    label: 'System Administrator',
    value: 'systemAdministrator',
  },
  {
    label: 'Management',
    value: 'management',
  },
  {
    label: 'Human Resources',
    value: 'humanResources',
  },
  {
    label: 'Standard Employee',
    value: 'standardEmployee',
  },
  {
    label: 'Inactive',
    value: 'inactive',
  },
];

// ============================================================
// DROPDOWN COMPONENT
// ============================================================

function SimpleDropdown({ label, value, onChange, options }) {
  const [visible, setVisible] = React.useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Button onPress={() => setVisible(true)}>
          {selectedLabel || `Select ${label}`}
        </Button>
      }>
      {options.map((opt) => (
        <Menu.Item
          key={opt.value}
          title={opt.label}
          onPress={() => {
            onChange(opt.value);
            setVisible(false);
          }}
        />
      ))}
    </Menu>
  );
}

// ============================================================
// ANNOUNCEMENTS
// ============================================================

function AnnouncementsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <TopHeader title="Announcements" />

      <FlatList
        data={announcements}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => (
          <Card style={{ margin: 10 }}>
            <Card.Content>
              <Text variant="titleMedium">{item.title}</Text>

              <Text
                numberOfLines={2}
                style={{
                  color: '#595959',
                  marginTop: 6,
                }}>
                {item.preview || item.content}
              </Text>

              <Text
                style={{
                  marginTop: 6,
                  color: '#595959',
                }}>
                {item.author} • {item.date} • {item.time}
              </Text>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

// ============================================================
// DIRECTORY
// ============================================================

function DirectoryScreen({ navigation }) {
  const { people } = React.useContext(PeopleContext);

  const { playTap } = React.useContext(SoundContext);

  const [search, setSearch] = React.useState('');

  useFocusEffect(
    React.useCallback(() => {
      console.log('Directory refreshed');
    }, [])
  );

  const filtered = people
    .filter((p) => p.permissionsType !== 'inactive')
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={{ flex: 1 }}>
      <TopHeader title="Directory" />

      <View style={{ padding: 10 }}>
        <TextInput
          placeholder="Search people..."
          value={search}
          onChangeText={setSearch}
          mode="outlined"
        />
      </View>

      {/* SORTING LIST ALPHABETICALLY */}

      <FlatList
        data={[...filtered].sort((a, b) => a.name.localeCompare(b.name))}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            left={() => (
              <Avatar.Text
                size={40}
                label={item.name[0]}
                style={{
                  backgroundColor: '#595959',
                }}
              />
            )}
            onPress={() => {
              playTap();

              navigation.navigate('Contact', {
                personId: item.id,
              });
            }}
          />
        )}
      />

      {/* PLUS BUTTON TO ADD PERSON */}

      <FAB
        icon="plus"
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          backgroundColor: '#941A1D',
        }}
        color="#FFFFFF"
        onPress={() => {
          playTap();
          navigation.navigate('AddPerson');
        }}
      />
    </View>
  );
}

// ============================================================
// CONTACT SCREEN
// ============================================================

function ContactScreen({ route, navigation }) {
  const { personId } = route.params;

  const { people, setPeople } = React.useContext(PeopleContext);

  const { playTap } = React.useContext(SoundContext);

  const person = React.useMemo(
    () => people.find((p) => p.id === personId),
    [people, personId]
  );

  const [dialogVisible, setDialogVisible] = React.useState(false);

  const [snackbar, setSnackbar] = React.useState(false);

  const [role, setRole] = React.useState(person?.permissionsType || '');

  React.useEffect(() => {
    if (person) {
      setRole(person.permissionsType);
    }
  }, [person]);

  if (!person) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text>Person not found.</Text>

        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  const personAnnouncements = announcements.filter(
    (a) => a.author === person.name
  );

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header
        style={{
          backgroundColor: '#941A1D',
        }}>
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          color="#FFFFFF"
        />

        <Appbar.Content
          title={person.name}
          titleStyle={{
            color: '#FFFFFF',
          }}
        />

        <Appbar.Action
          icon="pencil"
          color="#FFFFFF"
          onPress={() => {
            playTap();

            navigation.navigate('EditPerson', {
              personId: person.id,
            });
          }}
        />

        <Appbar.Action
          icon="dots-vertical"
          color="#FFFFFF"
          onPress={() => {
            playTap();
            setDialogVisible(true);
          }}
        />
      </Appbar.Header>

      <ScrollView>
        <Card style={{ margin: 10 }}>
          <Card.Content>
            <Avatar.Icon
              size={70}
              icon="account"
              style={{
                alignSelf: 'center',
                backgroundColor: '#595959',
              }}
            />

            <Text
              style={{
                color: '#595959',
              }}>
              Department
            </Text>

            <List.Item
              title={person.department}
              left={() => <List.Icon icon="account-group" />}
            />

            <Text
              style={{
                color: '#595959',
              }}>
              Phone
            </Text>

            <List.Item
              title={person.phone}
              left={() => <List.Icon icon="phone" />}
            />

            <Text
              style={{
                color: '#595959',
                marginTop: 10,
              }}>
              Address
            </Text>

            <View
              style={{
                flexDirection: 'row',
                marginLeft: 12,
                marginTop: 5,
              }}>
              <List.Icon icon="map-marker" />

              <View>
                <Text>{person.addressStreet}</Text>

                <Text>
                  {person.addressCity} {person.addressStateTerr}{' '}
                  {person.addressPostcode}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={{ margin: 10 }}>
          <Card.Title title="Recent Announcements" />

          <Card.Content>
            {personAnnouncements.length === 0 ? (
              <Text>No announcements</Text>
            ) : (
              personAnnouncements.map((item) => (
                <Card
                  key={item.id}
                  style={{
                    marginBottom: 10,
                  }}
                  mode="outlined">
                  <Card.Content>
                    <Text variant="titleMedium">{item.title}</Text>

                    <Text
                      numberOfLines={2}
                      style={{
                        color: '#595959',
                        marginTop: 5,
                      }}>
                      {item.preview}
                    </Text>

                    <Text
                      style={{
                        color: '#595959',
                        marginTop: 5,
                      }}>
                      {item.author} • {item.date} • {item.time}
                    </Text>
                  </Card.Content>
                </Card>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Permissions</Dialog.Title>

          <Dialog.Content>
            <RadioButton.Group value={role} onValueChange={setRole}>
              <RadioButton.Item
                label="System Administrator"
                value="systemAdministrator"
              />

              <RadioButton.Item label="Management" value="management" />

              <RadioButton.Item
                label="Human Resources"
                value="humanResources"
              />

              <RadioButton.Item
                label="Standard Employee"
                value="standardEmployee"
              />

              <RadioButton.Item label="Inactive" value="inactive" />
            </RadioButton.Group>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Close</Button>

            <Button
              onPress={() => {
                setPeople((prev) =>
                  prev.map((p) =>
                    p.id === person.id
                      ? {
                          ...p,
                          permissionsType: role,
                        }
                      : p
                  )
                );

                setDialogVisible(false);
                setSnackbar(true);
              }}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbar}
        onDismiss={() => setSnackbar(false)}
        duration={2000}>
        Updated
      </Snackbar>
    </View>
  );
}

// ============================================================
// REQUESTS
// ============================================================

function RequestsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <TopHeader title="Requests" />

      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text variant="headlineMedium">Coming Soon</Text>
      </View>
    </View>
  );
}

// ============================================================
// STEPPER
// ============================================================

function Stepper({ value, onChange, min, max, step, formatValue }) {
  const decrease = () => {
    const next = Math.max(min, Number((value - step).toFixed(2)));

    onChange(next);
  };

  const increase = () => {
    const next = Math.min(max, Number((value + step).toFixed(2)));

    onChange(next);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
      }}>
      <Button
        mode="outlined"
        onPress={decrease}
        disabled={value <= min}
        style={{
          minWidth: 50,
        }}>
        −
      </Button>

      <Text
        style={{
          minWidth: 80,
          textAlign: 'center',
          fontSize: 18,
          fontWeight: 'bold',
        }}>
        {formatValue(value)}
      </Text>

      <Button
        mode="outlined"
        onPress={increase}
        disabled={value >= max}
        style={{
          minWidth: 50,
        }}>
        +
      </Button>
    </View>
  );
}

// ============================================================
// SETTINGS
// ============================================================

function SettingsScreen() {
  const { setPeople } = React.useContext(PeopleContext);

  const { soundEnabled, updateSoundEnabled } = React.useContext(SoundContext);

  const { fontScale, updateFontScale, brightness, updateBrightness } =
    React.useContext(PreferencesContext);

  const resetPeople = () => {
    Alert.alert(
      'Reset Demo Data',
      'This will remove all changes and restore the original employee data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Reset',
          style: 'destructive',

          onPress: async () => {
            setPeople(initialPeople);

            try {
              await AsyncStorage.setItem(
                PEOPLE_STORAGE_KEY,
                JSON.stringify(initialPeople)
              );
            } catch (error) {
              console.error('Failed to reset people:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <TopHeader title="Settings" />

      <ScrollView
        contentContainerStyle={{
          padding: 20,
        }}>
        <Text
          variant="titleLarge"
          style={{
            marginBottom: 20,
          }}>
          Settings
        </Text>

        {/* TEXT SIZE */}

        <Text
          variant="titleLarge"
          style={{
            marginBottom: 10,
          }}>
          Text Size
        </Text>

        <Text
          style={{
            fontSize: 16 * fontScale,
            marginBottom: 10,
          }}>
          This is an example of your application text.
        </Text>

        <Stepper
          value={fontScale}
          onChange={updateFontScale}
          min={0.8}
          max={1.4}
          step={0.1}
          formatValue={(value) => `${Math.round(value * 100)}%`}
        />

        {/* BRIGHTNESS */}

        <Text
          variant="titleLarge"
          style={{
            marginTop: 20,
            marginBottom: 10,
          }}>
          Brightness
        </Text>

        <Stepper
          value={brightness}
          onChange={updateBrightness}
          min={0.1}
          max={1}
          step={0.05}
          formatValue={(value) => `${Math.round(value * 100)}%`}
        />

        {/* SOUND */}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 15,
          }}>
          <View
            style={{
              flex: 1,
            }}>
            <Text variant="titleMedium">Sound Effects</Text>

            <Text
              style={{
                color: '#595959',
              }}>
              Play sounds for actions and errors
            </Text>
          </View>

          <Switch
            value={soundEnabled}
            onValueChange={updateSoundEnabled}
            color="#941A1D"
          />
        </View>

        {/* DATA */}

        <Text
          variant="titleLarge"
          style={{
            marginTop: 30,
            marginBottom: 20,
          }}>
          Data
        </Text>

        <Button mode="outlined" onPress={resetPeople} textColor="#941A1D">
          Reset Demo Data
        </Button>
      </ScrollView>
    </View>
  );
}

// ============================================================
// ADD PERSON
// ============================================================

function AddPersonScreen({ navigation }) {
  const [snackbar, setSnackbar] = React.useState(false);

  const { people, setPeople } = React.useContext(PeopleContext);

  const { playSuccess, playError } = React.useContext(SoundContext);

  const [name, setName] = React.useState('');

  const [phone, setPhone] = React.useState('');

  const [addressStreet, setAddressStreet] = React.useState('');

  const [addressCity, setAddressCity] = React.useState('');

  const [addressStateTerr, setAddressStateTerr] = React.useState('');

  const [addressPostcode, setAddressPostcode] = React.useState('');

  const [department, setDepartment] = React.useState('');

  const [permissionsType, setPermissionsType] = React.useState('');

  const currentPerson = {
    name,
    phone,
    addressStreet,
    addressCity,
    addressStateTerr,
    addressPostcode,
    department,
    permissionsType,
  };

  const isValid = validateAndCheckDuplicate(currentPerson, people);

  const savePerson = () => {
    if (!validatePerson(currentPerson)) {
      playError();

      Alert.alert('Invalid Details', 'Please complete all required fields.');

      return;
    }

    if (isDuplicatePerson(currentPerson, people)) {
      playError();

      Alert.alert(
        'Duplicate Person',
        'A person with the same name and phone number already exists.'
      );

      return;
    }

    const newPerson = {
      id: Math.max(...people.map((p) => p.id), 0) + 1,

      ...currentPerson,
    };

    setPeople((prev) => [...prev, newPerson]);

    playSuccess();

    setSnackbar(true);

    setTimeout(() => {
      setSnackbar(false);

      navigation.replace('Contact', {
        personId: newPerson.id,
      });
    }, 800);
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        marginTop: 10,
      }}>
      <Appbar.Header
        style={{
          backgroundColor: '#941A1D',
        }}>
        <LogoTitle />

        <Appbar.Content
          title="Add Person"
          titleStyle={{
            color: '#ffffff',
          }}
        />
      </Appbar.Header>

      <ScrollView>
        <TextInput label="Name" value={name} onChangeText={setName} />

        <TextInput label="Phone" value={phone} onChangeText={setPhone} />

        <TextInput
          label="Street"
          value={addressStreet}
          onChangeText={setAddressStreet}
        />

        <TextInput
          label="City"
          value={addressCity}
          onChangeText={setAddressCity}
        />

        <SimpleDropdown
          label="State"
          value={addressStateTerr}
          onChange={setAddressStateTerr}
          options={stateOptions}
        />

        <TextInput
          label="Postcode"
          value={addressPostcode}
          onChangeText={(text) => {
            const numbersOnly = text.replace(/[^0-9]/g, '');

            if (numbersOnly.length <= 4) {
              setAddressPostcode(numbersOnly);
            }
          }}
          keyboardType="numeric"
          maxLength={4}
        />

        <SimpleDropdown
          label="Department"
          value={department}
          onChange={setDepartment}
          options={departmentOptions}
        />

        <SimpleDropdown
          label="Permissions"
          value={permissionsType}
          onChange={setPermissionsType}
          options={permissionOptions}
        />

        <Button
          mode="contained"
          onPress={savePerson}
          disabled={!isValid}
          style={{
            marginTop: 20,
            backgroundColor: '#941A1D',
          }}>
          Save Person
        </Button>
      </ScrollView>

      <Snackbar visible={snackbar} onDismiss={() => setSnackbar(false)}>
        Person added successfully
      </Snackbar>
    </View>
  );
}

// ============================================================
// EDIT PERSON
// ============================================================

function EditPersonScreen({ route, navigation }) {
  const { personId } = route.params;

  const { people, setPeople } = React.useContext(PeopleContext);

  const person = React.useMemo(
    () => people.find((p) => p.id === personId),
    [people, personId]
  );

  const { playSuccess, playError } = React.useContext(SoundContext);

  const [snackbar, setSnackbar] = React.useState(false);

  const [name, setName] = React.useState(person?.name || '');

  const [phone, setPhone] = React.useState(person?.phone || '');

  const [addressStreet, setAddressStreet] = React.useState(
    person?.addressStreet || ''
  );

  const [addressCity, setAddressCity] = React.useState(
    person?.addressCity || ''
  );

  const [addressStateTerr, setAddressStateTerr] = React.useState(
    person?.addressStateTerr || ''
  );

  const [addressPostcode, setAddressPostcode] = React.useState(
    person?.addressPostcode || ''
  );

  const [department, setDepartment] = React.useState(person?.department || '');

  const [permissionsType, setPermissionsType] = React.useState(
    person?.permissionsType || ''
  );

  if (!person) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text>Person not found.</Text>

        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  const updatedPerson = {
    id: person.id,
    name,
    phone,
    addressStreet,
    addressCity,
    addressStateTerr,
    addressPostcode,
    department,
    permissionsType,
  };

  const isValid = validateAndCheckDuplicate(updatedPerson, people);

  const handleSave = () => {
    if (!validatePerson(updatedPerson)) {
      playError();

      Alert.alert('Invalid Details', 'Please complete all required fields.');

      return;
    }

    if (isDuplicatePerson(updatedPerson, people)) {
      playError();

      Alert.alert(
        'Duplicate Person',
        'Another person already has this name and phone number.'
      );

      return;
    }

    setPeople((prev) =>
      prev.map((p) => (p.id === updatedPerson.id ? updatedPerson : p))
    );

    playSuccess();

    setSnackbar(true);

    setTimeout(() => {
      setSnackbar(false);
      navigation.goBack();
    }, 800);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
        }}>
        <TextInput label="Name" value={name} onChangeText={setName} />

        <TextInput label="Phone" value={phone} onChangeText={setPhone} />

        <TextInput
          label="Street"
          value={addressStreet}
          onChangeText={setAddressStreet}
        />

        <TextInput
          label="City"
          value={addressCity}
          onChangeText={setAddressCity}
        />

        <SimpleDropdown
          label="State"
          value={addressStateTerr}
          onChange={setAddressStateTerr}
          options={stateOptions}
        />

        <TextInput
          label="Postcode"
          value={addressPostcode}
          onChangeText={(text) => {
            const numbersOnly = text.replace(/[^0-9]/g, '');

            if (numbersOnly.length <= 4) {
              setAddressPostcode(numbersOnly);
            }
          }}
          keyboardType="numeric"
          maxLength={4}
        />

        <SimpleDropdown
          label="Department"
          value={department}
          onChange={setDepartment}
          options={departmentOptions}
        />

        <SimpleDropdown
          label="Permissions"
          value={permissionsType}
          onChange={setPermissionsType}
          options={permissionOptions}
        />

        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!isValid}
          style={{
            marginTop: 20,
            backgroundColor: '#941A1D',
          }}>
          Save Changes
        </Button>
      </ScrollView>

      <Snackbar visible={snackbar} onDismiss={() => setSnackbar(false)}>
        Person edited successfully
      </Snackbar>
    </View>
  );
}

// ============================================================
// NAVIGATION
// ============================================================

const Stack = createNativeStackNavigator();

function DirectoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Directory"
        component={DirectoryScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="EditPerson"
        component={EditPersonScreen}
        options={{
          title: 'Edit Person',

          headerStyle: {
            backgroundColor: '#941A1D',
          },

          headerTintColor: '#FFFFFF',

          headerTitleStyle: {
            color: '#FFFFFF',
          },
        }}
      />

      <Stack.Screen
        name="AddPerson"
        component={AddPersonScreen}
        options={{
          title: 'Add Person',
          headerStyle: {
            backgroundColor: '#941A1D',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            color: '#FFFFFF',
          },
        }}
      />
    </Stack.Navigator>
  );
}

// ============================================================
// TOP HEADER
// ============================================================

function TopHeader({ title }) {
  return (
    <Appbar.Header
      style={{
        backgroundColor: '#941A1D',
      }}>
      <LogoTitle />

      <Appbar.Content
        title={title}
        titleStyle={{
          color: '#FFFFFF',
        }}
      />
    </Appbar.Header>
  );
}

// ============================================================
// THEME
// ============================================================

function createTheme(fontScale) {
  return {
    ...DefaultTheme,

    fonts: {
      ...DefaultTheme.fonts,

      displayLarge: {
        ...DefaultTheme.fonts.displayLarge,
        fontFamily: 'Trebuchet',
        fontSize: 57 * fontScale,
      },

      displayMedium: {
        ...DefaultTheme.fonts.displayMedium,
        fontFamily: 'Trebuchet',
        fontSize: 45 * fontScale,
      },

      displaySmall: {
        ...DefaultTheme.fonts.displaySmall,
        fontFamily: 'Trebuchet',
        fontSize: 36 * fontScale,
      },

      headlineLarge: {
        ...DefaultTheme.fonts.headlineLarge,
        fontFamily: 'Trebuchet',
        fontSize: 32 * fontScale,
      },

      headlineMedium: {
        ...DefaultTheme.fonts.headlineMedium,
        fontFamily: 'Trebuchet',
        fontSize: 28 * fontScale,
      },

      headlineSmall: {
        ...DefaultTheme.fonts.headlineSmall,
        fontFamily: 'Trebuchet',
        fontSize: 24 * fontScale,
      },

      titleLarge: {
        ...DefaultTheme.fonts.titleLarge,
        fontFamily: 'TrebuchetBold',
        fontSize: 22 * fontScale,
      },

      titleMedium: {
        ...DefaultTheme.fonts.titleMedium,
        fontFamily: 'TrebuchetBold',
        fontSize: 16 * fontScale,
      },

      titleSmall: {
        ...DefaultTheme.fonts.titleSmall,
        fontFamily: 'TrebuchetBold',
        fontSize: 14 * fontScale,
      },

      bodyLarge: {
        ...DefaultTheme.fonts.bodyLarge,
        fontFamily: 'Trebuchet',
        fontSize: 16 * fontScale,
      },

      bodyMedium: {
        ...DefaultTheme.fonts.bodyMedium,
        fontFamily: 'Trebuchet',
        fontSize: 14 * fontScale,
      },

      bodySmall: {
        ...DefaultTheme.fonts.bodySmall,
        fontFamily: 'Trebuchet',
        fontSize: 12 * fontScale,
      },

      labelLarge: {
        ...DefaultTheme.fonts.labelLarge,
        fontFamily: 'Trebuchet',
        fontSize: 14 * fontScale,
      },

      labelMedium: {
        ...DefaultTheme.fonts.labelMedium,
        fontFamily: 'Trebuchet',
        fontSize: 12 * fontScale,
      },

      labelSmall: {
        ...DefaultTheme.fonts.labelSmall,
        fontFamily: 'Trebuchet',
        fontSize: 11 * fontScale,
      },
    },
  };
}

// ============================================================
// MAIN APP CONTENT
// ============================================================

function AppContent() {
  const [index, setIndex] = React.useState(0);

  // IMPORTANT:
  // PreferencesContext is available here because
  // App() below wraps AppContent with PreferencesProvider.

  const { fontScale } = React.useContext(PreferencesContext);

  const { playTap } = React.useContext(SoundContext);

  const routes = [
    {
      key: 'directory',
      title: 'Directory',
      focusedIcon: 'account-group',
    },

    {
      key: 'announcements',
      title: 'Announcements',
      focusedIcon: 'bullhorn',
    },

    {
      key: 'requests',
      title: 'Requests',
      focusedIcon: 'clipboard-text',
    },

    {
      key: 'settings',
      title: 'Settings',
      focusedIcon: 'cog',
    },
  ];

  const theme = React.useMemo(() => createTheme(fontScale), [fontScale]);

  const renderScene = BottomNavigation.SceneMap({
    directory: DirectoryStack,

    announcements: AnnouncementsScreen,

    requests: RequestsScreen,

    settings: SettingsScreen,
  });

  const [fontsLoaded] = useFonts({
    Trebuchet: require('./assets/Trebuc.ttf'),

    TrebuchetBold: require('./assets/Trebucbd.ttf'),

    TrebuchetItalic: require('./assets/Trebucit.ttf'),

    TrebuchetBoldItalic: require('./assets/Trebucbi.ttf'),
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <BottomNavigation
          shifting={true}
          navigationState={{
            index,
            routes,
          }}
          onIndexChange={(newIndex) => {
            if (newIndex !== index) {
              playTap();
            }

            setIndex(newIndex);
          }}
          renderScene={renderScene}
        />
      </NavigationContainer>
    </PaperProvider>
  );
}

// ============================================================
// ROOT APP
// ============================================================

export default function App() {
  return (
    <PeopleProvider>
      <SoundProvider>
        <PreferencesProvider>
          <AppContent />
        </PreferencesProvider>
      </SoundProvider>
    </PeopleProvider>
  );
}
