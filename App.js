import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

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

// IMPORT PEOPLE
const PeopleContext = React.createContext();
const headerWhiteIcons = {
  color: '#FFFFFF',
};

function PeopleProvider({ children }) {
  const [people, setPeople] = React.useState(initialPeople);

  return (
    <PeopleContext.Provider value={{ people, setPeople }}>
      {children}
    </PeopleContext.Provider>
  );
}

// IMPORT LOGO
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

// LIST DROP-DOWN OPTIONS
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
  { label: 'System Administrator', value: 'systemAdministrator' },
  { label: 'Management', value: 'management' },
  { label: 'Human Resources', value: 'humanResources' },
  { label: 'Standard Employee', value: 'standardEmployee' },
  { label: 'Inactive', value: 'inactive' },
];

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

// SCREENS
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
              {/* 2 LINE PREVIEW */}
              <Text
                numberOfLines={2}
                style={{ color: '#595959', marginTop: 6 }}>
                {item.preview || item.content}
              </Text>
              <Text style={{ marginTop: 6, color: '#595959' }}>
                {item.author} • {item.date} • {item.time}
              </Text>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

// DIRECTORY - LIST OF CONTACTS
function DirectoryScreen({ navigation }) {
  const { people } = React.useContext(PeopleContext);
  const [search, setSearch] = React.useState('');

  // SET BACK TO TOP OF DIRECTORY TREE WHEN  TAPPED
  useFocusEffect(
    React.useCallback(() => {
      console.log('Directory refreshed');
    }, [])
  );

  // HIDE INACTIVE USERS FROM LIST
  const filtered = people
    .filter((p) => p.permissionsType !== 'inactive')
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  // SEARCH BAR
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

      {/* SORTING LIST ALPHABETICALLY  */}
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
                style={{ backgroundColor: '#595959' }}
              />
            )}
            onPress={() =>
              navigation.navigate('Contact', { personId: item.id })
            }
          />
        )}
      />

      {/* PLUS BUTTON TO ADD PERSON*/}
      <FAB
        icon="plus"
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          backgroundColor: '#941A1D',
        }}
        color="#FFFFFF"
        onPress={() => navigation.navigate('AddPerson')}
      />
    </View>
  );
}

{
  /* CONTACT PROFILE SCREEN */
}
function ContactScreen({ route, navigation }) {
  const { personId } = route.params;
  const { people } = React.useContext(PeopleContext);

  const person = React.useMemo(
    () => people.find((p) => p.id === personId),
    [people, personId]
  );
  const [dialogVisible, setDialogVisible] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState(false);
  const [role, setRole] = React.useState(personId.permissionsType);
  const personAnnouncements = announcements.filter(
    (a) => a.author === person?.name
  );

  {
    /* BACK BUTTON & EDIT ICON */
  }
  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header style={{ backgroundColor: '#941A1D' }}>
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          color="#FFFFFF"
        />
        <Appbar.Content title={person.name} titleStyle={{ color: '#FFFFFF' }} />
        <Appbar.Action
          icon="pencil"
          color="#FFFFFF"
          onPress={() =>
            navigation.navigate('EditPerson', {
              personId: person.id,
            })
          }
        />
        <Appbar.Action
          icon="dots-vertical"
          color="#FFFFFF"
          onPress={() => setDialogVisible(true)}
        />
      </Appbar.Header>
      {/* PROFILE */}
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

            {/* SHOW PERSON'S DETAILS  */}
            <Text style={{ color: '#595959' }}>Department</Text>
            <List.Item
              title={person.department}
              left={() => <List.Icon icon="account-group" />}
            />
            <Text style={{ color: '#595959' }}>Phone</Text>
            <List.Item
              title={person.phone}
              left={() => <List.Icon icon="phone" />}
            />
            <Text style={{ color: '#595959', marginTop: 10 }}>Address</Text>
            <View
              style={{ flexDirection: 'row', marginLeft: 12, marginTop: 5 }}>
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
        {/* SHOW PERSON'S RECENT ANNOUNCEMENTS & PREVIEWS */}
        <Card style={{ margin: 10 }}>
          <Card.Title title="Recent Announcements" />

          <Card.Content>
            {personAnnouncements.length === 0 ? (
              <Text>No announcements</Text>
            ) : (
              personAnnouncements.map((item) => (
                <Card
                  key={item.id}
                  style={{ marginBottom: 10 }}
                  mode="outlined">
                  <Card.Content>
                    <Text variant="titleMedium">{item.title}</Text>

                    <Text
                      numberOfLines={2}
                      style={{ color: '#595959', marginTop: 5 }}>
                      {item.preview}
                    </Text>

                    <Text style={{ color: '#595959', marginTop: 5 }}>
                      {item.author} • {item.date} • {item.time}
                    </Text>
                  </Card.Content>
                </Card>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
      {/* CHANGE PERSON'S PERMISSIONS POP-UP */}
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

function RequestsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <TopHeader title="Requests" />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="headlineMedium">Coming Soon</Text>
      </View>
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <TopHeader title="Settings" />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="headlineMedium">Coming Soon</Text>
      </View>
    </View>
  );
}

// ADD PERSON SCREEN
function AddPersonScreen({ navigation }) {
  const [snackbar, setSnackbar] = React.useState(false);
  const { people, setPeople } = React.useContext(PeopleContext);

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
      Alert.alert('Invalid Details', 'Please complete all required fields.');
      return;
    }

    if (isDuplicatePerson(currentPerson, people)) {
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

    setSnackbar(true);

    setTimeout(() => {
      setSnackbar(false);

      navigation.replace('Contact', {
        personId: newPerson.id,
      });
    }, 800);
  };

  return (
    <View style={{ flex: 1, padding: 16, marginTop: 10 }}>
      <Appbar.Header style={{ backgroundColor: '#941A1D' }}>
        <LogoTitle />
        <Appbar.Content title="Add Person" titleStyle={{ color: '#ffffff' }} />
      </Appbar.Header>

      {/* INPUT FIELDS */}
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
        style={{ marginTop: 20, backgroundColor: '#941A1D' }}>
        Save Person
      </Button>

      <Snackbar visible={snackbar} onDismiss={() => setSnackbar(false)}>
        Person added successfully
      </Snackbar>
    </View>
  );
}

function EditPersonScreen({ route, navigation }) {
  const { personId } = route.params;
  const { people, setPeople } = React.useContext(PeopleContext);

  const person = React.useMemo(
    () => people.find((p) => p.id === personId),
    [people, personId]
  );

  const [snackbar, setSnackbar] = React.useState(false);

  const [name, setName] = React.useState(person.name);
  const [phone, setPhone] = React.useState(person.phone);
  const [addressStreet, setAddressStreet] = React.useState(
    person.addressStreet
  );
  const [addressCity, setAddressCity] = React.useState(person.addressCity);
  const [addressStateTerr, setAddressStateTerr] = React.useState(
    person.addressStateTerr
  );
  const [addressPostcode, setAddressPostcode] = React.useState(
    person.addressPostcode
  );
  const [department, setDepartment] = React.useState(person.department);
  const [permissionsType, setPermissionsType] = React.useState(
    person.permissionsType
  );

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
      Alert.alert('Invalid Details', 'Please complete all required fields.');
      return;
    }

    if (isDuplicatePerson(updatedPerson, people)) {
      Alert.alert(
        'Duplicate Person',
        'Another person already has this name and phone number.'
      );
      return;
    }

    setPeople((prev) =>
      prev.map((p) => (p.id === updatedPerson.id ? updatedPerson : p))
    );

    setSnackbar(true);

    setTimeout(() => {
      setSnackbar(false);
      navigation.goBack();
    }, 800);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* INPUT FIELDS */}
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
          style={{ marginTop: 20, backgroundColor: '#941A1D' }}>
          Save Changes
        </Button>
      </ScrollView>

      <Snackbar visible={snackbar} onDismiss={() => setSnackbar(false)}>
        Person edited successfully
      </Snackbar>
    </View>
  );
}

// NAVIGATION STACK
const Stack = createNativeStackNavigator();

function DirectoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Directory"
        component={DirectoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{ headerShown: false }}
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
      <Stack.Screen name="AddPerson" component={AddPersonScreen} />
    </Stack.Navigator>
  );
}

function TopHeader({ title }) {
  return (
    <Appbar.Header style={{ backgroundColor: '#941A1D' }}>
      <LogoTitle />
      <Appbar.Content title={title} titleStyle={{ color: '#FFFFFF' }} />
    </Appbar.Header>
  );
}

const theme = {
  ...DefaultTheme,
  fonts: {
    ...DefaultTheme.fonts,

    displayLarge: {
      ...DefaultTheme.fonts.displayLarge,
      fontFamily: 'Trebuchet',
    },
    displayMedium: {
      ...DefaultTheme.fonts.displayMedium,
      fontFamily: 'Trebuchet',
    },
    displaySmall: {
      ...DefaultTheme.fonts.displaySmall,
      fontFamily: 'Trebuchet',
    },

    headlineLarge: {
      ...DefaultTheme.fonts.headlineLarge,
      fontFamily: 'Trebuchet',
    },
    headlineMedium: {
      ...DefaultTheme.fonts.headlineMedium,
      fontFamily: 'Trebuchet',
    },
    headlineSmall: {
      ...DefaultTheme.fonts.headlineSmall,
      fontFamily: 'Trebuchet',
    },

    titleLarge: {
      ...DefaultTheme.fonts.titleLarge,
      fontFamily: 'TrebuchetBold',
    },
    titleMedium: {
      ...DefaultTheme.fonts.titleMedium,
      fontFamily: 'TrebuchetBold',
    },
    titleSmall: {
      ...DefaultTheme.fonts.titleSmall,
      fontFamily: 'TrebuchetBold',
    },

    bodyLarge: {
      ...DefaultTheme.fonts.bodyLarge,
      fontFamily: 'Trebuchet',
    },
    bodyMedium: {
      ...DefaultTheme.fonts.bodyMedium,
      fontFamily: 'Trebuchet',
    },
    bodySmall: {
      ...DefaultTheme.fonts.bodySmall,
      fontFamily: 'Trebuchet',
    },

    labelLarge: {
      ...DefaultTheme.fonts.labelLarge,
      fontFamily: 'Trebuchet',
    },
    labelMedium: {
      ...DefaultTheme.fonts.labelMedium,
      fontFamily: 'Trebuchet',
    },
    labelSmall: {
      ...DefaultTheme.fonts.labelSmall,
      fontFamily: 'Trebuchet',
    },
  },
};

// MAIN APP
export default function App() {
  const [index, setIndex] = React.useState(0);

  const routes = [
    { key: 'directory', title: 'Directory', focusedIcon: 'account-group' },
    { key: 'announcements', title: 'Announcements', focusedIcon: 'bullhorn' },
    { key: 'requests', title: 'Requests', focusedIcon: 'clipboard-text' },
    { key: 'settings', title: 'Settings', focusedIcon: 'cog' },
  ];

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
    <PeopleProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <BottomNavigation
            shifting={true}
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={renderScene}
          />
        </NavigationContainer>
      </PaperProvider>
    </PeopleProvider>
  );
}
