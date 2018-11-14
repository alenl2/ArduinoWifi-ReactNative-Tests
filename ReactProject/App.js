/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import { Text, View, Button, DeviceEventEmitter, TextInput } from 'react-native';
import { LineChart, XAxis, YAxis, Grid } from 'react-native-svg-charts'
import KeepAwake from 'react-native-keep-awake';
import UsbSerial from './UsbSerial';

type Props = {};
export default class App extends Component<Props> {

  constructor(props) {
    super(props);
    this.distance = [0,0];
    this.broken = [0,0];
    this.light = [0,0];
    this.ws = null;
    this.state = {
      ip: "192.168.1.2:81",
      distance: this.distance,
      light: this.light,
      broken: this.broken,
      message: "Waiting",
      buttonLabel: "Connect",
      sensTime: "50"
    };
    this.lastData = "";
    KeepAwake.activate();
    UsbSerial.openDeviceAsync()
    DeviceEventEmitter.addListener('OnSerialData', (e) => {
      this.lastData = e.data
    });
    this.runner();
  }

  runner() {
    try {
      var op = JSON.parse(this.lastData);
      console.log(op)

      if(op.status === "range valid"){
        this.distance.push(op.range);
      }else{
        this.broken.push(op.range);
      }
      
      this.light.push(parseFloat(op.ambient))
      if(this.distance.length > 100){
        this.distance.shift();
      }
      if(this.broken.length > 100){
        this.broken.shift();
      }
      if(this.light.length > 100){
        this.light.shift();
      }
      var msg = "MSG: "+op.status+" MODE:"+op.mode+" STATE:"+op.sensorState+ " TimeBudget:"+op.timeBudget;

      this.setState({ broken:[...this.broken], distance:[...this.distance], light:[...this.light], message:  msg})
    } catch (e) {
      console.log(e)
    }


    setTimeout(() => {
        this.runner();
    }, 1);
  }
  activateLasers1(){
    UsbSerial.writeInDeviceAsync("S:"+this.state.sensTime+":")
  }

  activateLasers2(){
    UsbSerial.writeInDeviceAsync("M:"+this.state.sensTime+":")
  }
  activateLasers3(){
    UsbSerial.writeInDeviceAsync("L:"+this.state.sensTime+":")
  }

  render() {
    const contentInset = { top: 20, bottom: 20 }
    const contentInset2 = { top: 20, bottom: 20 }
    const contentInset3 = { top: 20, bottom: 20 }


    return (
      <View>
        <View style={{flexDirection: "row"}}>
        </View>
        <KeepAwake/>
        <Text>{this.state.message}</Text>
        <View style={{flexDirection: "row"}}>
          <TextInput style={{height: 40, borderColor: 'gray', borderWidth: 1, width: 200}} onChangeText={(sensTime) => this.setState({sensTime})} value={this.state.sensTime} />
          <Button onPress={this.activateLasers1.bind(this)} title={" Short"}/>
          <Button onPress={this.activateLasers2.bind(this)} title={" Medium"}/>
          <Button onPress={this.activateLasers3.bind(this)} title={" Long"}/>
        </View>


        <View style={{ height: 200, flexDirection: 'row' }}>
              <YAxis
              data={ this.state.distance }
              contentInset={ contentInset }
              svg={{
                  fill: 'grey',
                  fontSize: 10,
              }}
              numberOfTicks={ 10 }
              formatLabel={ value => `${value}mm` }
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



        <View style={{ height: 200, flexDirection: 'row' }}>
        <YAxis
        data={ this.state.broken }
        contentInset={ contentInset3 }
        svg={{
            fill: 'grey',
            fontSize: 10,
        }}
        numberOfTicks={ 10 }
        formatLabel={ value => `${value}` }
    />
    <LineChart
        style={{ flex: 1, marginLeft: 16 }}
        data={ this.state.broken }
        svg={{ stroke: 'rgb(134, 65, 244)' }}
        contentInset={ contentInset3 }
    >
        <Grid/>
    </LineChart>
  </View>

      </View>
    );
  }




}
