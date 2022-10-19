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
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
    marginHorizontal: 20,
    borderBottomWidth: 0,
  },
  kInputContainer: {
    marginTop: 0,
    marginBottom:10,
    marginHorizontal: 20,
  },
  slippingContainer: {
    marginBottom: 10,
  },
  tokenContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#f5f6fc',
    borderRadius: 10,
    paddingVertical: 10,
    position: 'relative',
    marginVertical: 3,
    marginHorizontal:20
  },
  switchIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex:100
  },
  footer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    padding: 20,
  },

  swapButton: { width: 100, height: 10 },
  Kinput: {
    borderColor: '#E5E5EE',
    borderBottomWidth: 1,
    borderStyle: 'solid',
    width: 100,
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
    marginLeft: 50,
    width: 120,
  },
  switchButton: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'white',
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
