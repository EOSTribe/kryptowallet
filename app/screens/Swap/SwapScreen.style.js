import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  scrollContentContainer: {
    flex: 1,
  },
  backButton: {
    marginTop: 10,
    marginLeft: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingRight: 10,
    paddingLeft: 10,
  },
  body: {
    backgroundColor: 'white',
    borderBottomColor: '#c1c1c1',
    paddingTop: 30,
  },
  netWorkContainer: {},
  slippingContainer: {
    marginBottom: 30,
  },
  fromContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 30,
    marginRight: 20,
    marginLeft: 20,
  },
  toContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 30,
    marginRight: 20,
    marginLeft: 20,
  },
  footer: {
    backgroundColor: 'white',
    display: 'flex',
    justifyContent: 'flex-start',
    paddingTop: 40,
    padding: 20,
  },
  input: {
    height: 40,
    width: 220,
    borderWidth: 3,
    padding: 10,
    marginRight: 10,
    borderColor: '#DDDDDD',
    borderRadius: 10,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#3aacff',
    padding: 10,
    borderRadius: 10,
    marginLeft: 10,
    width: 120,
  },
  text: {
    color: 'white',
  },
  modalContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    opacity: 0.5,
  },
});

export default styles;
