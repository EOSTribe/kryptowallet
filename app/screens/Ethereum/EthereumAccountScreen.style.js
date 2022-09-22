import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  scrollContentContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  inner: {
    flex: 1,
    padding: 5,
  },
  moreInner: {
    flex: 1,
    padding: 15,
  },
  header: {
    marginTop: 5,
  },
  qrcode: {
    alignSelf: 'center',
    marginBottom: 5,
  },
  list: {
    marginTop: 5,
  },
  listItem: {
    marginTop: 5,
    marginHorizontal: 10,
  },
  link: {
    color: 'blue',
    fontFamily: 'Nunito-Bold',
    fontSize: 15,
  },
  buttonIcon: {
    width: 48,
    height: 48,
  },
  hidden: {
    opacity: 0,
    marginTop: 8,
  },
  inputContainer: {
    marginTop: 5,
  },
  balanceItem: {
    flex: 1,
  },
  spacer: {
    marginTop: 10,
  },
  spacerToBottom: {
    flex: 1,
  },
  column: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
  addressLink: {
    color: 'blue',
    fontFamily: 'Nunito-Bold',
    fontSize: 15,
    margin: 5,
    flex: 1,
  },
  button: {
    width: width - 40,
    alignSelf: 'center',
    marginTop: 10,
  },
  buttonColumn: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent:'space-between',
    padding: 6
  },
  smallButton: {
    width: width / 2 - 40,
    alignSelf: 'center',
  },
  chainIcon: {
    width: 24,
    height: 24,
  },
  chainName: {
    padding: 0,
    color: '#6A63EE',
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
  },
});

export default styles;
