/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import { Text, View, Button, DeviceEventEmitter, TextInput,ScrollView } from 'react-native';
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
    this.sigma = [0,0];
    this.reflect = [0,0];
    this.spad = [0,0];
    this.ws = null;
    this.state = {
      ip: "192.168.1.2:81",
      distance: this.distance,
      light: this.light,
      broken: this.broken,
      sigma: this.sigma,
      message: "Waiting",
      buttonLabel: "Connect",
      reflect: this.reflect,
      spad: this.spad,
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

      if(op.s === "range valid"){
        this.distance.push(op.r);
      }else{
        if(op.r > 200){
          this.broken.push(op.r);
        }
      }
      this.sigma.push(op.a)
      if(this.sigma.length > 100){
        this.sigma.shift();
      }

      this.spad.push(op.p)
      if(this.spad.length > 100){
        this.spad.shift();
      }

      this.reflect.push(op.h)
      if(this.reflect.length > 100){
        this.reflect.shift();
      }

      this.light.push(parseFloat(op.i))
      if(this.distance.length > 100){
        this.distance.shift();
      }
      if(this.broken.length > 100){
        this.broken.shift();
      }
      if(this.light.length > 100){
        this.light.shift();
      }
      var msg = "MSG: "+op.s+" MODE:"+op.m+" STATE:"+op.t+ " TimeBudget:"+op.b;

      this.setState({ reflect:[...this.reflect], spad:[...this.spad], sigma:[...this.sigma], broken:[...this.broken], distance:[...this.distance], light:[...this.light], message:  msg})
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

    return (
      <View>
      <ScrollView>

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

      <Text>RANGE</Text>

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

      <Text>Ambient light</Text>
      <View style={{ height: 200, flexDirection: 'row' }}>
            <YAxis
            data={ this.state.light }
            contentInset={ contentInset }
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
            contentInset={ contentInset }
        >
            <Grid/>
        </LineChart>
      </View>


      <Text>Invalid range clamped to 200</Text>

      <View style={{ height: 200, flexDirection: 'row' }}>
      <YAxis
      data={ this.state.broken }
      contentInset={ contentInset }
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
      contentInset={ contentInset }
  >
      <Grid/>
  </LineChart>
  </View>

  <Text>Sigma</Text>

  <View style={{ height: 200, flexDirection: 'row' }}>
  <YAxis
  data={ this.state.sigma }
  contentInset={ contentInset }
  svg={{
      fill: 'grey',
      fontSize: 10,
  }}
  numberOfTicks={ 10 }
  formatLabel={ value => `${value}` }
/>
<LineChart
  style={{ flex: 1, marginLeft: 16 }}
  data={ this.state.sigma }
  svg={{ stroke: 'rgb(134, 65, 244)' }}
  contentInset={ contentInset }
>
  <Grid/>
</LineChart>
</View>


<Text>Reflectance</Text>
<View style={{ height: 200, flexDirection: 'row' }}>
<YAxis
data={ this.state.reflect }
contentInset={ contentInset }
svg={{
    fill: 'grey',
    fontSize: 10,
}}
numberOfTicks={ 10 }
formatLabel={ value => `${value}` }
/>
<LineChart
style={{ flex: 1, marginLeft: 16 }}
data={ this.state.reflect }
svg={{ stroke: 'rgb(134, 65, 244)' }}
contentInset={ contentInset }
>
<Grid/>
</LineChart>
</View>


<Text>SPAD</Text>
<View style={{ height: 200, flexDirection: 'row' }}>
<YAxis
data={ this.state.spad }
contentInset={ contentInset }
svg={{
    fill: 'grey',
    fontSize: 10,
}}
numberOfTicks={ 10 }
formatLabel={ value => `${value}` }
/>
<LineChart
style={{ flex: 1, marginLeft: 16 }}
data={ this.state.spad }
svg={{ stroke: 'rgb(134, 65, 244)' }}
contentInset={ contentInset }
>
<Grid/>
</LineChart>
</View>


      </ScrollView>


      </View>
    );
  }




}
