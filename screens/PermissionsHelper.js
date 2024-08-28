import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Request storage permission on Android devices.
 * @returns {Promise<void>}
 * @throws {Error} If permission is not granted.
 */
export const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: 'Permission Required',
        message: 'App needs access to your storage to pick images',
      }
    );

    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Permission Denied');
    }
  }
};
