package com.reactproject;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbManager;
import android.support.annotation.Nullable;
import android.util.Log;

import com.felhr.usbserial.CDCSerialDevice;
import com.felhr.usbserial.UsbSerialDevice;
import com.felhr.usbserial.UsbSerialInterface;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;


import java.util.HashMap;
import java.util.Map;



public class ReactUsbSerialModule extends ReactContextBaseJavaModule {

    public static final String ACTION_USB_ATTACHED = "android.hardware.usb.action.USB_DEVICE_ATTACHED";
    public static final String ACTION_USB_DETACHED = "android.hardware.usb.action.USB_DEVICE_DETACHED";
    public static final String ACTION_USB_PERMISSION_GRANTED = "com.felhr.usbservice.USB_PERMISSION_GRANTED";
    public static final String ACTION_USB_PERMISSION_NOT_GRANTED = "com.felhr.usbservice.USB_PERMISSION_NOT_GRANTED";
    public static final String ACTION_USB_DISCONNECTED = "com.felhr.usbservice.USB_DISCONNECTED";
    private static final String ACTION_USB_PERMISSION = "com.android.example.USB_PERMISSION";
    private static final int BAUD_RATE = 9600; // BaudRate. Change this value if you need
    public static boolean SERVICE_CONNECTED = false;

	private UsbManager usbManager;
    private UsbDevice device;
    private UsbDeviceConnection connection;
    private UsbSerialDevice serialPort;
	private String TAG = "ReactUsbSerial";

	private boolean serialPortConnected;
	
    private final HashMap<String, UsbSerialDevice> usbSerialDriverDict = new HashMap<>();
    public ReactApplicationContext REACTCONTEXT;

	
	private UsbSerialInterface.UsbReadCallback mCallback = new UsbSerialInterface.UsbReadCallback() {
        @Override
        public void onReceivedData(byte[] arg0) {
            try {
                Log.d(TAG, "Got data");
                Log.d(TAG, "Got"+new String(arg0));
                emitNewData(arg0);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    };

	private final BroadcastReceiver usbReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context arg0, Intent arg1) {
            Log.d(TAG, "Broadcast");

            if (arg1.getAction().equals(ACTION_USB_PERMISSION)) {
                Log.d(TAG, "Broadcast usb");

                boolean granted = arg1.getExtras().getBoolean(UsbManager.EXTRA_PERMISSION_GRANTED);
                if (granted) // User accepted our USB connection. Try to open the device as a serial port
                {
                    Log.d(TAG, "Broadcast usb granted");
                    Intent intent = new Intent(ACTION_USB_PERMISSION_GRANTED);
                    arg0.sendBroadcast(intent);
                    connection = usbManager.openDevice(device);
                    new ConnectionThread().start();
                } else // User not accepted our USB connection. Send an Intent to the Main Activity
                {
                    Log.d(TAG, "Broadcast usb not granted");
                    Intent intent = new Intent(ACTION_USB_PERMISSION_NOT_GRANTED);
                    arg0.sendBroadcast(intent);
                }
            } else if (arg1.getAction().equals(ACTION_USB_ATTACHED)) {
                if (!serialPortConnected)
                    Log.d(TAG, "Broadcast usb attaced");
                    findSerialPortDevice(); // A USB device has been attached. Try to open it as a Serial port
            } else if (arg1.getAction().equals(ACTION_USB_DETACHED)) {
                Log.d(TAG, "Broadcast usb detached");
                // Usb device was disconnected. send an intent to the Main Activity
                Intent intent = new Intent(ACTION_USB_DISCONNECTED);
                arg0.sendBroadcast(intent);
                if (serialPortConnected) {
                    serialPort.close();
                }
                serialPortConnected = false;
            }
        }
    };
	
    public ReactUsbSerialModule(ReactApplicationContext reactContext) {
        super(reactContext);
        REACTCONTEXT = reactContext;
		serialPortConnected = false;
        ReactApplicationContext rAppContext = getReactApplicationContext();
		usbManager = (UsbManager) rAppContext.getSystemService(Context.USB_SERVICE);
        IntentFilter intFilter = new IntentFilter(ACTION_USB_PERMISSION);
        rAppContext.registerReceiver(usbReceiver, intFilter);
        findSerialPortDevice();
    }

    @Override
    public String getName() {
        return "UsbSerial";
    }

    @ReactMethod
    public void openDeviceAsync(Promise p) {
        try {
			p.resolve(null);
        } catch (Exception e) {
            p.reject(e);
        }
    }

    @ReactMethod
    public void writeInDeviceAsync(String value, Promise p) {
        try {
			if (serialPort != null)
				serialPort.write(value.getBytes());
			p.resolve(null);
        } catch (Exception e) {
            p.reject(e);
        }
    }
	
	private void findSerialPortDevice() {
        // This snippet will try to open the first encountered usb device connected, excluding usb root hubs
        HashMap<String, UsbDevice> usbDevices = usbManager.getDeviceList();
        if (!usbDevices.isEmpty()) {
            boolean keep = true;
            for (Map.Entry<String, UsbDevice> entry : usbDevices.entrySet()) {
                device = entry.getValue();
                int deviceVID = device.getVendorId();
                int devicePID = device.getProductId();
                Log.d(TAG, "USB DETECTED VID "+deviceVID+" PID "+ devicePID);
                requestUserPermission();
            }
        } else {
            Log.d(TAG, "NO USB1");
        }
    }

    /*
     * A simple thread to open a serial port.
     * Although it should be a fast operation. moving usb operations away from UI thread is a good thing.
     */
    private class ConnectionThread extends Thread {
        @Override
        public void run() {
            serialPort = UsbSerialDevice.createUsbSerialDevice(device, connection);
            if (serialPort != null) {
                if (serialPort.open()) {
                    serialPortConnected = true;
                    serialPort.setBaudRate(BAUD_RATE);
                    serialPort.setDataBits(UsbSerialInterface.DATA_BITS_8);
                    serialPort.setStopBits(UsbSerialInterface.STOP_BITS_1);
                    serialPort.setParity(UsbSerialInterface.PARITY_NONE);
                    serialPort.setFlowControl(UsbSerialInterface.FLOW_CONTROL_OFF);
                    serialPort.read(mCallback);
                    Log.d(TAG, "USB RDY");
                } else {
                    // Serial port could not be opened, maybe an I/O error or if CDC driver was chosen, it does not really fit
                    // Send an Intent to Main Activity
                    if (serialPort instanceof CDCSerialDevice) {
                        Log.d(TAG, "DRIVER BROKEN");
                    } else {
                        Log.d(TAG, "DEVICE BROKEN");
                    }
                }
            } else {
                Log.d(TAG, "DEVICE NOT SUPORTED");
            }
        }
    }

	private void requestUserPermission() {
        ReactApplicationContext rAppContext = getReactApplicationContext();
        PendingIntent mPendingIntent = PendingIntent.getBroadcast(rAppContext, 0, new Intent(ACTION_USB_PERMISSION), 0);
        usbManager.requestPermission(device, mPendingIntent);
    }
	
	
    private void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap params) {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
    }
	
	String wholeData = "";
	
    public void emitNewData(byte[] data) {
		String inData = new String(data)
		
		inData.s
        WritableMap params = Arguments.createMap();
        params.putString("data", new String(data));
        sendEvent(REACTCONTEXT, "OnSerialData", params);
    }

}
