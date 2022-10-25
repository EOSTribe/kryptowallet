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
    // paddingTop: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#78a7e6',
    paddingVertical: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginVertical: 5,
    marginLeft: 20,
    marginRight: 5,
    borderBottomWidth: 0,
  },
  kInputContainer: {
    marginTop: 0,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  slippingContainer: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  tokenContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f5f6fc',
    borderRadius: 10,
    paddingVertical: 20,
    position: 'relative',
    marginVertical: 3,
    marginHorizontal: 20,
  },
  switchIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: -20,
    zIndex: 20,
    position: 'relative',
  },
  footer: {
    display: 'flex',
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    padding: 20,
    width: '100%',
  },
  swapButton: {
    width: '100%',
    height: 10,
  },
  Kinput: {
    borderColor: '#E5E5EE',
    borderBottomWidth: 1,
    borderStyle: 'solid',
    width: 150,
  },
  slipInput: {
    borderColor: '#E5E5EE',
    borderBottomWidth: 1,
    borderStyle: 'solid',
    width: 100,
    marginLeft: 30,
    marginBottom: 0,
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
  placeholder: {
    color: '#ddd',
  },
  button: {
    width: 120,
    marginBottom: 30,
  },
  switchButton: {
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
  balance: {
    justifyContent: 'flex-end',
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    right: 0,
    marginHorizontal: 20,
  },

  // maxBalance: { paddingHorizontal:20}
  // balanceContainer: {paddingVertical:10}
});

export default styles;
