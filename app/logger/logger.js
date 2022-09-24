import DeviceInfo from 'react-native-device-info';

let deviceInfo = {
  brand: DeviceInfo.getBrand(),
  appName: DeviceInfo.getApplicationName(),
  appVersion: DeviceInfo.getVersion(),
  appBuildNumber: DeviceInfo.getBuildNumber(),
  bundleId: DeviceInfo.getBundleId(),
  deviceId: DeviceInfo.getDeviceId(),
  deviceType: DeviceInfo.getDeviceType(),
  model: DeviceInfo.getModel(),
  systemName: DeviceInfo.getSystemName(),
  systemVersion: DeviceInfo.getSystemVersion(),
  uniqueId: DeviceInfo.getUniqueId(),
};

const log = async error => {
  console.log(error);
  /*
  fetch('http://wallet.eostribe.io/logger', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device: deviceInfo,
      wallet: 'TRIBE',
      error: error,
    }),
  });
  */
};

const report = async message => {
  //console.log(message);
  fetch('http://wallet.eostribe.io/logger', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device: deviceInfo,
      wallet: 'TRIBE',
      message: message,
    }),
  });
};

export { log, report };
