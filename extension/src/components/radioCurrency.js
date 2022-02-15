/*global chrome*/
import React, { useState } from 'react'
import { ToggleButton, ToggleButtonGroup, Button, ButtonGroup } from 'react-bootstrap';


function RadioCurrency() {

    const [value, setValue] = useState(1);

    const [responseFromContent, setResponseFromContent] = useState('');

    const handleChange = val => setValue(val);

    const sendCurrency = () => {
        const message = {
            currency: value,
        }

        const queryInfo = {
            active: true,
            currentWindow: true
        };

        /**
         * We can't use "chrome.runtime.sendMessage" for sending messages from React.
         * For sending messages from React we need to specify which tab to send it to.
         */
        chrome.tabs && chrome.tabs.query(queryInfo, tabs => {
            const currentTabId = tabs[0].id;
            /**
             * Sends a single message to the content script(s) in the specified tab,
             * with an optional callback to run when a response is sent back.
             *
             * The runtime.onMessage event is fired in each content script running
             * in the specified tab for the current extension.
             */
            chrome.tabs.sendMessage(
                currentTabId,
                message,
                (response) => {
                    setResponseFromContent(response);
                });
        });
    };


    return (
        <ButtonGroup style={{paddingTop: '10px'}} className="btn-group-vertical">
            <ToggleButtonGroup
                type="radio"
                name="value"
                value={value}
                onChange={handleChange}
            >
                <ToggleButton value={1}>BYN</ToggleButton> <br />
                <ToggleButton value={2}>USD</ToggleButton>
            </ToggleButtonGroup>
            <Button onClick={sendCurrency} style={{margin: '10px'}}>Switch</Button>
        </ButtonGroup>
    )
}

export default RadioCurrency