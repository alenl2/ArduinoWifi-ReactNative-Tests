/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import { Text, View, Button, DeviceEventEmitter } from 'react-native';
import { LineChart, XAxis, YAxis, Grid } from 'react-native-svg-charts'
import KeepAwake from 'react-native-keep-awake';
import { UsbSerial} from 'react-native-usbserial';

type Props = {};
export default class App extends Component<Props> {

  constructor(props) {
    super(props);
    this.distance = [];
    this.light = [];
    this.ws = null;
    this.usbs = new UsbSerial();
    this.state = {
      ip: "192.168.1.2:81",
      distance: this.distance,
      light: this.light,
      message: "Waiting",
      buttonLabel: "Connect"
    };
  }

  
  async getDeviceAsync() {
    try {
        const deviceList = await this.usbs.getDeviceListAsync();
        const firstDevice = deviceList[0];

        if (firstDevice) {
            var x = await this.usbs.openDeviceAsync(firstDevice);
            return x;
        }
    } catch (err) {
        console.warn(err);
    }
  }

  async tesad(id){
    await this.usbs.startIoManager(id);
  }

  
  getDeviceBlah() {
    this.getDeviceAsync().then(device => {
      console.log("next");
      console.log(device);
      if (device) {
        DeviceEventEmitter.addListener('UsbSerialEvent', (e) => {
          console.log('UsbSerialEvent', e);
        });
        this.tesad(device.id);
      }
    });
  }


  render() {
    KeepAwake.activate();
    const contentInset = { top: 20, bottom: 20 }
    const contentInset2 = { top: 20, bottom: 20 }


    return (
      <View>
        <View style={{flexDirection: "row"}}>
          <Button onPress={this.getDeviceBlah.bind(this)} title={this.state.buttonLabel+" Short"}/>
        </View>
        <KeepAwake/>
        <Text>{this.state.message}</Text>
 
        <View style={{ height: 200, flexDirection: 'row' }}>
              <YAxis
              data={ this.state.distance }
              contentInset={ contentInset }
              svg={{
                  fill: 'grey',
                  fontSize: 10,
              }}
              numberOfTicks={ 10 }
              formatLabel={ value => `${value}cm` }
          />
          <LineChart
              style={{ flex: 1, marginLeft: 16 }}
              data={ this.state.distance }
              svg={{ stroke: 'rgb(134, 65, 244)' }}
              contentInset={ contentInset }
          >
              <Grid/>
          </LineChart>
        </View>

        <View style={{ height: 200, flexDirection: 'row' }}>
              <YAxis
              data={ this.state.light }
              contentInset={ contentInset2 }
              svg={{
                  fill: 'grey',
                  fontSize: 10,
              }}
              numberOfTicks={ 10 }
              formatLabel={ value => `${value}` }
          />
          <LineChart
              style={{ flex: 1, marginLeft: 16 }}
              data={ this.state.light }
              svg={{ stroke: 'rgb(134, 65, 244)' }}
              contentInset={ contentInset2 }
          >
              <Grid/>
          </LineChart>
        </View>

      </View>
    );
  }




}
