// ==UserScript==
// @name         Whatsapp Contacts Customizer
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Allowing users to name unsaved contacts without saving them in the phone's contacts list.
// @author       https://github.com/mmehedihasan05
// @match        https://web.whatsapp.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=whatsapp.com
// @grant        none
// ==/UserScript==

(function () {
    ("use strict");

    // Whatsapp Contacts Customizer

    console.log("Whatsapp Customizer Code Injected.");

    let currentOpenedContact = "";
    let currentUserInfo = getUserInfo();
    let messagesParent = document.querySelector(`#app .two > ._2Ts6i._2xAQV`);
    let chatListParentSelector = document.querySelector(`[aria-label="Chat list"]`);

    // Css styles to show popup.
    (function customStylesInject() {
        const styleElement = document.createElement("style");

        styleElement.textContent = `
        div#custom_popUpBackground {
            position: absolute;
            background: #000d1547;
            width: 100%;
            height: 100%;
            transition: all 0.2s;
        }
        div#custom_popUpBackground[visibility="hidden"]  {
            z-index: -9;
            opacity: 0;
        }
        div#custom_popUpBackground[visibility="shown"] {
            z-index: 9999;
            opacity: 1;
        }


        div#custom_contactSavingPopUp {
            position: absolute;
            top: 60px;
            right: 70px;
            z-index: 99999;
            transition: all 0.2s;
        }

        div#custom_contactSavingPopUp[visibility="shown"] {
            right: 70px;
        }

        div#custom_contactSavingPopUp[visibility="hidden"] {
            right: -300px;
        }

        div#custom_upArrow {
            position: relative;
            top: 0px;
            left: 161px;
            width: 0;
            height: 0;
            border-left: 12px solid transparent;
            border-right: 12px solid transparent;
            border-bottom: 12px solid #2a3942;
        }

        div#custom_contactSavingContents {
            background-color: #2a3942;
            color: rgb(209, 215, 219);
            font-size: 16px;
            padding: 12px 16px;
            display: grid;
            gap: 15px;
            border-radius: 4px;
            box-shadow: 0px 0px 12px 3px #080b0e;
        }

        input#custom_contactName {
            width: 95%;
            background-color: #202c33;
            color: rgb(209, 215, 219);
            outline: none;
            border: 1px solid rgb(199, 199, 199);
            border: none;
            border-radius: 4px;
            padding: 4px 6px;
        }

        button#custom_contactSave {
            width: 100%;
            background-color: #161e23;
            color: rgb(209, 215, 219);
            border: none;
            cursor: pointer;
            padding: 4px 0px;
            border-radius: 4px;
            transition: transform .2s;
        }

        button#custom_contactSave:active {
            transform: scale(0.90)
        }
`;

        document.head.appendChild(styleElement);
    })();

    // Add an overlay behind the popup. Helps to close pop up after clicking outside
    (function popUpBackground() {
        let custom_popUpBackground = document.createElement("div");
        custom_popUpBackground.id = "custom_popUpBackground";
        custom_popUpBackground.setAttribute("visibility", "hidden");
        custom_popUpBackground.addEventListener("click", () => {
            togglePopUp();
        });
        document.body.appendChild(custom_popUpBackground);
    })();

    // Pop up including Number, Input FIeld and Save button
    (function contactSavingPopUpInject() {
        let custom_contactSavingPopUp = document.createElement("div");
        custom_contactSavingPopUp.id = "custom_contactSavingPopUp";
        custom_contactSavingPopUp.className = "hide";
        custom_contactSavingPopUp.setAttribute("visibility", "hidden");

        custom_contactSavingPopUp.innerHTML = `
        <div id="custom_upArrow"></div>
        <div id="custom_contactSavingContents">
            <div id="custom_currentContact">Number: ${currentOpenedContact}</div>
            <input type="text" id="custom_contactName" placeholder="Type contact name...">
            <button id="custom_contactSave">Save</button>
        </div>
    `;

        custom_contactSavingPopUp
            .querySelector("#custom_contactSave")
            .addEventListener("click", () => {
                let contactName =
                    custom_contactSavingPopUp.querySelector("#custom_contactName").value;

                userInfoUpdate(contactName);

                togglePopUp();

                custom_contactSavingPopUp.querySelector("#custom_contactName").value = "";
                allContactsModification();
            });

        document.body.appendChild(custom_contactSavingPopUp);
    })();

    // get user info from localstorage
    function getUserInfo() {
        // getting data
        let cus_userInfo = JSON.parse(localStorage.getItem("cus_userInfo")) || {}; // Need to work: set condition for null
        return cus_userInfo;
    }

    // insert new data to localstorage and update currentUserInfo
    function userInfoUpdate(contactName) {
        // inserted
        currentUserInfo[currentOpenedContact] = contactName;

        // setting data
        localStorage.setItem("cus_userInfo", JSON.stringify(currentUserInfo));

        // updated currentUserInfo
        currentUserInfo = getUserInfo();
    }

    // open and close number customizer popup.
    function togglePopUp() {
        let contactSavingPopUp = document.querySelector("#custom_contactSavingPopUp");
        let popUpBackground = document.querySelector("#custom_popUpBackground");
        if (contactSavingPopUp.getAttribute("visibility") === "shown") {
            contactSavingPopUp.setAttribute("visibility", "hidden");
            popUpBackground.setAttribute("visibility", "hidden");
        } else {
            contactSavingPopUp.setAttribute("visibility", "shown");
            popUpBackground.setAttribute("visibility", "shown");
        }
    }

    // Updates all contacts
    function allContactsModification() {
        // Selector of each chat contact.
        // Selected using div because those classname changes sometime.
        let allNumberElemSelector = [
            ...chatListParentSelector.querySelectorAll(
                `[role="listitem"] [aria-selected] > div > div:nth-child(2) > div:nth-child(1) [title]`
            ),
        ];

        allNumberElemSelector.forEach((numberElem) => {
            singleContactModification(numberElem);
        });
    }

    // Convert contact to name in chatList
    function singleContactModification(numberElem) {
        let number_or_name = numberElem.title;

        if (currentUserInfo[number_or_name]) {
            // If the number has been previously customized, the script will replace the existing number with the new one provided.
            numberElem.innerText = currentUserInfo[number_or_name];
        } else if (number_or_name !== numberElem.innerText) {
            // During scrolling, elements are not removed or injected anew. Instead, the inner contents are updated dynamically.
            // To detect these changes, a mutation observer is used to monitor changes in the inner contents of the elements.
            // Refer to the chatList_observer for further details.
            numberElem.innerText = number_or_name;
        }
    }

    let messagesParent_observer_options = {
        childList: true,
    };

    var messagesParent_observer = new MutationObserver((mutationsList) => {
        // To add a '+' icon beside the number in the top middle for renaming, a mutation observer is implemented to detect changes in the message page.s
        console.log("main updated");

        // Selector
        // Detecting if message page opened or not.
        if (messagesParent.querySelector("#main")) {
            // Selector
            // Selector to get the number from top middle in message page.
            let contactNumber = messagesParent
                .querySelector(`#main header > div:nth-child(2)`)
                .innerText.split("\n")[0];

            // Selector
            // this element holds call, search, menu icons.
            // number customization icon '+' will be placed here.
            let mainMenu_element = document.querySelector(`#main header > div:nth-child(3) > div`);
            mainMenu_element.title = "Save Contact";

            // Creating number customization icon and then inserting.
            let addIcon = document.createElement("div");
            addIcon.innerHTML = `
        <button id="addButton">
            <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.75 8C12.75 7.58579 12.4142 7.25 12 7.25C11.5858 7.25 11.25 7.58579 11.25 8H12.75ZM11.25 16C11.25 16.4142 11.5858 16.75 12 16.75C12.4142 16.75 12.75 16.4142 12.75 16H11.25ZM8 11.25C7.58579 11.25 7.25 11.5858 7.25 12C7.25 12.4142 7.58579 12.75 8 12.75V11.25ZM16 12.75C16.4142 12.75 16.75 12.4142 16.75 12C16.75 11.5858 16.4142 11.25 16 11.25V12.75ZM11.25 8V16H12.75V8H11.25ZM8 12.75H16V11.25H8V12.75ZM20.25 12C20.25 16.5563 16.5563 20.25 12 20.25V21.75C17.3848 21.75 21.75 17.3848 21.75 12H20.25ZM12 20.25C7.44365 20.25 3.75 16.5563 3.75 12H2.25C2.25 17.3848 6.61522 21.75 12 21.75V20.25ZM3.75 12C3.75 7.44365 7.44365 3.75 12 3.75V2.25C6.61522 2.25 2.25 6.61522 2.25 12H3.75ZM12 3.75C16.5563 3.75 20.25 7.44365 20.25 12H21.75C21.75 6.61522 17.3848 2.25 12 2.25V3.75Z" fill="#aebac1"></path>
            </svg>
        </button>`;
            mainMenu_element.insertAdjacentElement("afterbegin", addIcon);

            // Pop up for contacts customization
            document.querySelector("#addButton").addEventListener("click", () => {
                currentOpenedContact = contactNumber;
                togglePopUp();

                document.querySelector(
                    "#custom_currentContact"
                ).innerText = `Number: ${currentOpenedContact}`;
            });
        }
    });

    const chatList_observer_options = {
        attributes: true,
        subtree: true,
        attributeFilter: ["title"],
    };

    let counter = 0;

    var chatList_observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            // During scrolling, the contents inside elements are updated. on that time title also updates of number selector.
            // This is detected by monitoring title changes. However, an issue arises where he last message also appears below the number and that message also includes in the title.
            // To prevent this, a check is added to ensure that only elements with the "aria-label" attribute are considered. As aria-label attribute doesn't presents on that message element.
            if (
                mutation.type === "attributes" &&
                mutation.attributeName === "title" &&
                mutation.target.hasAttribute("aria-label")
            ) {
                singleContactModification(mutation.target);

                document.title = "WhatsApp " + counter;
                counter++;
            }
        });
    });

    /*
        WhatsApp takes some time to load its contents, and using window.onload alone does not reliably detect this.
        Therefore, an interval is implemented to repeatedly start a function until the targeted element appears. Once the targeted element is detected, the interval is cleared, allowing the function to start working.
    */
    let myInterval = setInterval(starter, 700);

    function starter() {
        console.log("Whatsapp Customizer Starting...");

        /*
            document.querySelector(`#app .two > div:nth-child(4)`)
            The messages load inside the `#main` selector. Using this, it's easy to track whether new user messages have loaded or not. However, pressing ESC closes the messages and causes the `#main` element to disappear, turning off the observer. To address this issue, the parent of the `#main` element is selected.
            Class selection was avoided due to the presence of multiple elements with the same classname.
        */

        // Selector
        // To detect changes in the messages page, all messages are loaded inside this element.
        messagesParent = document.querySelector(`#app .two > div:nth-child(4)`);

        // Selector
        // The parent element of the parent element of the numbers of all chat lists.
        // During scrolling, the contents inside the chat list also update. This element is used to track them.
        chatListParentSelector = document.querySelector(`[aria-label="Chat list"]`);

        if (chatListParentSelector && messagesParent) {
            console.log("Whatsapp Customizer Started");

            clearInterval(myInterval);

            allContactsModification();

            // During scrolling, the contents inside the chat list also update. This element is used to track them.
            chatList_observer.observe(chatListParentSelector, chatList_observer_options);

            // A '+' icon needs to be shown at the top of each message list. Therefore, changes in message elements are tracked.
            messagesParent_observer.observe(messagesParent, messagesParent_observer_options);
        }
    }
})();
