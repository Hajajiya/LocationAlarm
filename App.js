import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  SafeAreaView,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Sound from 'react-native-sound'; 

const alarmSound = new Sound('alarm.mp3', Sound.MAIN_BUNDLE, (error) => {
  if (error) {
    console.log('Failed to load the sound', error);
    return;
  }
  console.log('Sound loaded successfully');
});

const App = () => {
  const [desiredLocation, setDesiredLocation] = useState('');
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);

  useEffect(() => {
    requestLocationPermission();

    fetchCurrentLocation();

    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        
        if (alarmEnabled && desiredLocation) {
          checkAlarmTrigger({ latitude, longitude });
        }
      },
      (error) => {
        console.error('Error watching position:', error);
      },
      { enableHighAccuracy: true, distanceFilter: 50 } 
    );

    return () => {
      Geolocation.clearWatch(watchId);
      alarmSound.stop();
    };
  }, [alarmEnabled, desiredLocation]);

  const requestLocationPermission = () => {
    Geolocation.requestAuthorization();
  };

  const fetchCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
      },
      (error) => {
        console.error('Error fetching current location:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleAlarmToggle = () => {
    setAlarmEnabled(!alarmEnabled);
    if (!alarmEnabled && currentLocation && desiredLocation) {
      checkAlarmTrigger(currentLocation);
    }
  };

  const handleLocationSubmit = () => {
    console.log('Desired Location:', desiredLocation);
    const [lat, lon] = desiredLocation.split(',').map(coord => parseFloat(coord.trim()));
    if (!isNaN(lat) && !isNaN(lon)) {
      setMarkerLocation({ latitude: lat, longitude: lon });
    } else {
      Alert.alert('Invalid Location', 'Please enter valid latitude, longitude format');
    }
  };
  
  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent?.coordinate || {};
    if (latitude && longitude) {
      setMarkerLocation({ latitude, longitude });
      setDesiredLocation(`${latitude}, ${longitude}`);
    }
  };
  

  const checkAlarmTrigger = (currentCoords) => {
    const distance = calculateDistance(currentCoords, markerLocation);
    console.log('distancedistance', distance);
    if (distance < 0.1) { 
      triggerAlarm();
    }
  };

  const calculateDistance = (coords1, coords2) => {
    if (!coords1 || !coords2) return Infinity;
    const lat1 = parseFloat(coords1.latitude);
    const lon1 = parseFloat(coords1.longitude);
    const lat2 = parseFloat(coords2.latitude);
    const lon2 = parseFloat(coords2.longitude);
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; 
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const triggerAlarm = () => {
    alarmSound.play((success) => {
      if (success) {
        console.log('Successfully  playing');
      } else {
        console.log('Failed to play ');
      }
    });
  
    Alert.alert(
      'Location Alarm',
      'You have reached your desired location!',
      [
        {
          text: 'OK',
          onPress: () => {
            alarmSound.stop();
            console.log('Alarm acknowledged');
          },
        },
      ],
      { cancelable: false }
    );
  };
console.log('markerLocation', markerLocation );
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Location Alarm</Text>

      <MapView
        style={styles.map}
        initialRegion={currentLocation && {
          latitude: currentLocation?.latitude,
          longitude: currentLocation?.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        onPress={handleMapPress}
      >
        {markerLocation && (
          <Marker
            coordinate={{
              latitude: markerLocation?.latitude,
              longitude: markerLocation?.longitude,
            }}
            title="Selected Location"
          />
        )}
      </MapView>

      <TextInput
        style={styles.input}
        placeholder="Enter desired location (latitude, longitude)"
        value={desiredLocation}
        onChangeText={(text) => setDesiredLocation(text)}
      />
      <TouchableOpacity style={styles.button} onPress={handleLocationSubmit}>
        <Text style={styles.buttonText}>Set Location</Text>
      </TouchableOpacity>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>Alarm Enabled</Text>
        <Switch
          value={alarmEnabled}
          onValueChange={handleAlarmToggle}
          trackColor={{ false: 'grey', true: 'grey' }}
          thumbColor={alarmEnabled ? 'black' : 'black'}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black'
  },
  map: {
    width: '80%',
    height: '50%',
    marginBottom: 20,
  },
  input: {
    width: '80%',
    height: 40,
    borderWidth: 1,
    borderColor: 'black',
    color:'black',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  button: {
    width: '80%',
    backgroundColor: 'black',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    color: 'black',
    marginBottom: 20,
  },
  toggleText: {
    fontSize: 16,
    marginRight: 10,
    color: 'black'
  },
});

export default App;
