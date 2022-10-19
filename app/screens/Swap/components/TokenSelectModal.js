import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Modal from 'react-native-modal';

import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { SvgUri } from 'react-native-svg';

const TokenSelectModal = ({
  onClose,
  visible,
  onChange,
  handleSearch,
  tokenItems,
  stableCoins,
}) => {
  const [text, setText] = React.useState('');
  const handleTokenSelect = tokenItem => () => {
    onChange(tokenItem);
    onClose();
  };

  const onChangeText = val => {
    setText(val);
    handleSearch(val);
  };

  useEffect(() => {
    visible && setText('');
  }, [visible]);

  return (
    <Modal isVisible={visible} style={styles.modal}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.title}>
            <Text>Select a Token</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcon name="close" size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.tokenSearchInput}>
            <MaterialIcon name="search" size={24} color="#99A1BD" />
            <TextInput
              style={styles.searchInput}
              onChangeText={value => {
                onChangeText(value);
              }}
              value={text}
              placeholder="Search name or paste address"
            />
          </View>
          <View style={styles.tokenItems}>
            {stableCoins.map((tokenItem, index) => (
              <TouchableOpacity
                key={index}
                onPress={handleTokenSelect(tokenItem)}>
                <View style={styles.tokenItem}>
                  <SvgUri
                    width={24}
                    height={24}
                    style={styles.tokenImg}
                    uri={tokenItem.logoURI}
                  />
                  <Text style={styles.tokenSymbol}>{tokenItem.symbol}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.body}>
          <ScrollView>
            {tokenItems.map((tokenItem, index) => (
              <TouchableOpacity
                key={index}
                onPress={handleTokenSelect(tokenItem)}>
                <View style={styles.tokenListItem}>
                  {tokenItem.logoURI ? (
                    <Image
                      style={styles.tokenListImg}
                      source={{ uri: tokenItem.logoURI }}
                    />
                  ) : (
                    <Text style={styles.tokenListImg} />
                  )}
                  <View>
                    <Text style={styles.tokenName}>{tokenItem.name}</Text>
                    <Text style={styles.tokenShortName}>
                      {tokenItem.symbol}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    flex: 1,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    flex: 1,
    overflow: 'hidden',
  },
  header: {
    borderBottomColor: '#c1c1c1',
    borderBottomWidth: 1,
    flexDirection: 'column',
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  title: {
    justifyContent: 'space-between',
    width: '100%',
    flexDirection: 'row',
    paddingBottom: 20,
  },
  body: {
    flex: 1,
    padding: 10,
  },
  tokenSearchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5e68873d',
    borderRadius: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#f5f6fc',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 5,
    color: 'black',
  },
  searchIcon: {
    marginVertical: 6,
  },
  tokenItems: {
    flexWrap: 'wrap',
    width: '100%',
    flexDirection: 'row',
    marginHorizontal: -5,
  },
  tokenItem: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#c1c1c1',
    // opacity: 0.5,
    borderRadius: 30,
    flexDirection: 'row',
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tokenListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    padding: 5,
  },
  tokenImg: {
    marginRight: 8,
  },
  tokenSymbol: {
    fontSize: 18,
  },
  tokenListImg: {
    marginRight: 15,
    width: 40,
    height: 40,
  },
  tokenName: {
    fontSize: 16,
  },
  tokenShortName: {
    color: 'gray',
    fontSize: 14,
  },
});

export default TokenSelectModal;
