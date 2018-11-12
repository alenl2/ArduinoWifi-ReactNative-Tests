import React from 'react';
import { StyleSheet, Text, View, Button, TextInput } from 'react-native';
import { LineChart, XAxis, YAxis, Grid } from 'react-native-svg-charts'

export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.distance = [];
    this.light = [];
    this.ws = null;

    this.state = {
      ip: "192.168.1.2:81",
      distance: this.distance,
      light: this.light,
      message: "Waiting",
      buttonLabel: "Connect"
    };
  }


  componentWillUnmount() {
    if(this.ws !== null){
      this.ws.close();
    }
    
  }

  render() {
    const contentInset = { top: 20, bottom: 20 }
    const contentInset2 = { top: 20, bottom: 20 }

    return (
      <View style={styles.container}>
        <Text>Enter device IP:Port</Text>
        <TextInput style={{height: 40, borderColor: 'gray', borderWidth: 1, width: 200}} onChangeText={(ip) => this.setState({ip})} value={this.state.ip} />
        <Button onPress={this.activateLasers.bind(this)} title={this.state.buttonLabel}/>
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


  activateLasers() {
    if(this.ws !== null){
      this.ws.close();
      this.ws = null;
      this.setState({buttonLabel: "Connect"})
      return;
    }

    this.setState({buttonLabel: "Disconnect"})

    this.ws = new WebSocket('ws://'+this.state.ip);

    this.ws.onopen = () => {
      console.log("open");
    };
  
    this.ws.onmessage = (e) => {
      try {
        var op = JSON.parse(e.data);
        if(op.status === "range valid"){
          this.distance.push(op.range);
        }
        
        this.light.push(parseFloat(op.ambient))
        if(this.distance.length > 100){
          this.distance.shift();
        }
        if(this.light.length > 100){
          this.light.shift();
        }
        this.setState({ distance:[...this.distance], light:[...this.light], message: op.status })
      } catch (e) {
      }

    };
  
    this.ws.onerror = (e) => {
      console.log(e.message);
    };
  
    this.ws.onclose = (e) => {
      console.log(e.code, e.reason);
    };
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});