/*global chrome*/
import React, { useState } from 'react'
import { ToggleButton, ToggleButtonGroup, Button } from 'react-bootstrap';


function RadioCurrency() {

    const [value, setValue] = useState(1);

    const [responseFromContent, setResponseFromContent] = useState('');

    const handleChange = val => setValue(val);

    const sendCurrency = () => {
        const message = {
            message: value,
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
        <div>
            <ToggleButtonGroup type="radio" name="value" value={value} onChange={handleChange}>
                <ToggleButton value={1}>BYN</ToggleButton>
                <ToggleButton value={2}>USD</ToggleButton>
            </ToggleButtonGroup>
            <Button variant="primary" onClick={sendCurrency}>Switch</Button>
        </div>
    )
}

export default RadioCurrency