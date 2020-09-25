// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('../ui/domutl.js').DomUtl;

const MoneysocketBeacon = require(
    '../moneysocket/beacon/beacon.js').MoneysocketBeacon;
const WebsocketLocation = require(
    '../moneysocket/beacon/location/websocket.js').WebsocketLocation;

const ConnectUi = require('../ui/connect.js').ConnectUi;
const SellerStackProgress = require(
    './stack_progress_ui.js').SellerStackProgress;


const PROTOCOL_PREFIX = "moneysocket:"

const MODES = new Set(["ENTER_BEACON",
                       "GENERATED_BEACON",
                       "OPERATING",
                       "CONNECTED",
                      ]);

class SellerConnectUi extends ConnectUi{
    postStackEvent(layer_name, event) {
        console.log("layer " + layer_name + " event: " + event);
        switch (layer_name) {
        case "OUTGOING_WEBSOCKET":
            switch (event) {
            case "NEXUS_CREATED":
                this.switchMode("OPERATING");
                break;
            case "NEXUS_WAITING":
                break;
            case "NEXUS_ANNOUNCED":
                break;
            case "NEXUS_REVOKED":
                this.switchMode("ENTER_BEACON");
                break;
            case "NEXUS_DESTROYED":
                this.switchMode("ENTER_BEACON");
                break;
            }
            break;
        case "OUTGOING_RENDEZVOUS":
            switch (event) {
            case "NEXUS_CREATED":
                break;
            case "NEXUS_WAITING":
                break;
            case "NEXUS_ANNOUNCED":
                break;
            case "NEXUS_REVOKED":
                break;
            case "NEXUS_DESTROYED":
                break;
            }
            break;
        case "CONSUMER":
            switch (event) {
            case "NEXUS_CREATED":
                break;
            case "NEXUS_WAITING":
                break;
            case "NEXUS_ANNOUNCED":
                break;
            case "NEXUS_REVOKED":
                break;
            case "NEXUS_DESTROYED":
                break;
            }
            break;
        case "SELLER":
            switch (event) {
            case "NEXUS_CREATED":
                break;
            case "NEXUS_WAITING":
                break;
            case "NEXUS_ANNOUNCED":
                this.switchMode("CONNECTED");
                break;
            case "NEXUS_REVOKED":
                break;
            case "NEXUS_DESTROYED":
                break;
            }
            break;
        }

        if (this.stack_progress != null) {
            this.stack_progress.drawStackEvent(layer_name, event);
        }
    }

    switchMode(new_mode) {
        console.assert(MODES.has(new_mode));
        this.mode = new_mode;

        DomUtl.deleteChildren(this.mode_switch_button_div);
        DomUtl.deleteChildren(this.mode_output_div);

        if (new_mode == "ENTER_BEACON") {
            this.stack_progress = null;
            this.return_mode = "ENTER_BEACON";
            var t = DomUtl.drawText(this.mode_output_div, "Input Beacon");
            t.setAttribute("style", "padding:5px;");

            DomUtl.drawBr(this.mode_output_div);
            this.input_div = DomUtl.drawTextInput(this.mode_output_div, "");
            DomUtl.drawBr(this.mode_output_div);

            DomUtl.drawButton(this.mode_output_div, "Scan QR",
                (function() {this.scanQr()}).bind(this));
            DomUtl.drawButton(this.mode_output_div, "Connect",
                (function() {
                    this.attemptConnectFromEnterBeacon();
                }).bind(this));

            this.setMessagePlaceholderDiv();

            DomUtl.drawButton(this.mode_switch_button_div, "Generate Beacon",
                (function() {
                    this.generateNewBeacon();
                    this.switchMode("GENERATED_BEACON");
                }).bind(this));

        } else if (new_mode == "GENERATED_BEACON") {
            this.stack_progress = null;
            this.return_mode = "GENERATED_BEACON";
            var t = DomUtl.drawText(this.mode_output_div, "Generated Beacon");
            t.setAttribute("style", "padding:5px;");

            DomUtl.qrCode(this.mode_output_div, this.beacon_str,
                          PROTOCOL_PREFIX);
            this.setCopyBeaconButton();
            DomUtl.drawBr(this.mode_output_div);
            DomUtl.drawButton(this.mode_output_div, "Connect",
                (function() {
                    this.attemptConnectFromGeneratedBeacon();
                }).bind(this));
            this.setMessagePlaceholderDiv();
            DomUtl.drawButton(this.mode_switch_button_div, "Input Beacon",
                (function() {this.switchMode("ENTER_BEACON")}).bind(this));

        } else if (new_mode == "OPERATING") {
            var t = DomUtl.drawText(this.mode_output_div, "Connecting");
            t.setAttribute("style", "padding:5px;");

            this.stack_progress = new SellerStackProgress(this.mode_output_div);

            this.setCopyBeaconButton();
            this.setMessagePlaceholderDiv();

            DomUtl.drawButton(this.mode_switch_button_div, "Disconnect",
                (function() {this.disconnect()}).bind(this));
        } else if (new_mode == "CONNECTED") {
            var t = DomUtl.drawText(this.mode_output_div, "Connected");
            t.setAttribute("style", "padding:5px;");

            DomUtl.drawButton(this.mode_switch_button_div, "Disconnect",
                (function() {this.disconnect()}).bind(this));
        }
    }
}

exports.SellerConnectUi = SellerConnectUi;
