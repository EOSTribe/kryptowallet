import { StyleSheet, Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
import { PRIMARY_BLUE } from '../../theme/colors';

const styles = StyleSheet.create({
  scrollContentContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 40,
  },
  button: {
    padding: 5,
    width: width - 40,
    alignSelf: 'center',
  },
  buttonIcon: {
    width: 18,
    height: 18,
    tintColor: '#FFF',
  },
  chainIcon: {
    width: 24,
    height: 24,
  },
  inputContainer: {
    marginTop: 20,
  },
  chainLabel: {
    color: PRIMARY_BLUE,
    fontSize: 16,
    marginTop: 40,
  },
  chainItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chainItem: {
    alignItems: 'center',
    width: 80,
    borderColor: 'gray',
  },
  chainItemSelected: {
    borderBottomWidth: 4,
  },
  chainItemImage: {
    width: 40,
    height: 40,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  error: {
    padding: 5,
    color: '#BF0F0F',
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
  },
  message: {
    padding: 5,
    color: '#000000',
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
  },
  chainName: {
    padding: 0,
    color: '#6A63EE',
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
  },
  spacer: {
    flex: 1,
  },
});

export default styles;
