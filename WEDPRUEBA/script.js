// Chrome Popup Index File

/*  GLOBAL VARIABLES */

// App constants
const EXTENSION_ID = "namibaeakmnknolcnomfdhklhkabkchl";
let BACKEND_URL = "https://penora-ai.herokuapp.com";
// BACKEND_URL = "http://localhost:5001";
// URL of where the AI routes are
const BACKEND_AI_URL = `${BACKEND_URL}/ai/api`;

// Chrome
let chromeTabId;

// Site specific variables
let onSupportedDomain = false;
let currSiteURL;
let isWritingSite = false;
let isTextInsertionSupported = false;
let isGoogleDocs = false;
let isNotion = false;

// Important data variables
let currSelectedText = null;
let lastGeneratedText = null;

// Template variables
let currTemplate;

// User variables
let popupUserId;
let userEmail;
let userData;
let userHistory;
let accessToken;

// Tabs
let currTab = "#penora-magic";
let prevTab = "";

// constants-tabs
const ONBOARDINGTAB = "#penora-magic"; 
const REWRITETAB = "#penora-rewrite"; 
const TEMPLATETAB = "#penora-templates"; 
const TLDRTAB = "#penora-tldr"; 
const FINDTAB = "#penora-finder"; 

// constant-template types = TempLarge
const responseTemplate = "response";
const outlineTemplate = "outline";
const introTemplate = "intro";
const conclusionTemplate = "conclusion";

// Initialize Mixpanel
(function (f, b) {
  if (!b.__SV) {
    var e, g, i, h;
    window.mixpanel = b;
    b._i = [];
    b.init = function (e, f, c) {
      function g(a, d) {
        var b = d.split(".");
        2 == b.length && ((a = a[b[0]]), (d = b[1]));
        a[d] = function () {
          a.push([d].concat(Array.prototype.slice.call(arguments, 0)));
        };
      }
      var a = b;
      "undefined" !== typeof c ? (a = b[c] = []) : (c = "mixpanel");
      a.people = a.people || [];
      a.toString = function (a) {
        var d = "mixpanel";
        "mixpanel" !== c && (d += "." + c);
        a || (d += " (stub)");
        return d;
      };
      a.people.toString = function () {
        return a.toString(1) + ".people (stub)";
      };
      i =
        "disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(
          " "
        );
      for (h = 0; h < i.length; h++) g(a, i[h]);
      var j = "set set_once union unset remove delete".split(" ");
      a.get_group = function () {
        function b(c) {
          d[c] = function () {
            call2_args = arguments;
            call2 = [c].concat(Array.prototype.slice.call(call2_args, 0));
            a.push([e, call2]);
          };
        }
        for (
          var d = {},
          e = ["get_group"].concat(Array.prototype.slice.call(arguments, 0)),
          c = 0;
          c < j.length;
          c++
        )
          b(j[c]);
        return d;
      };
      b._i.push([e, f, c]);
    };
    b.__SV = 1.2;
    e = f.createElement("script");
    e.type = "text/javascript";
    e.async = !0;
    e.src =
      "chrome-extension://namibaeakmnknolcnomfdhklhkabkchl/chrome-popup/mixpanel-2-latest.min.js";
    g = f.getElementsByTagName("script")[0];
    g.parentNode.insertBefore(e, g);
  }
})(document, window.mixpanel || []);

mixpanel.init("6a314f766eb4e703b699e61380eb5499", {
  debug: false,
  ignore_dnt: true,
});

const mixPanelReset = localStorage.getItem("PENORA_MIXPANEL_UPDATED_IDENTITY");
if (mixPanelReset === null) {
  chrome.storage.sync.get(["PENORA_USER_ID"]).then((result) => {
    popupUserId = result.PENORA_USER_ID;
    chrome.storage.sync.get(["PENORA_USER_EMAIL"]).then((result) => {
      userEmail = result.PENORA_USER_EMAIL;
      // if userId & email, then register user in mixpanel
      if (popupUserId && userEmail) {
        // set local storage val to true so that this doesn't run again
        localStorage.setItem("PENORA_MIXPANEL_UPDATED_IDENTITY", "true");
        mixpanel.identify(popupUserId);
        mixpanel.people.set({ $name: popupUserId, $email: userEmail });
      }
    });
  });
}

function getUserData() {
  // Get the user's data from the backend
  const url = `${BACKEND_URL}/auth/get-user`;

  // get user general data and set things up
  makePostRequest(url, { userId: popupUserId, accessToken }).then((response) => {
    userData = response;
    didUserUpgrade();
    setupSettingsPage(url);
  }).catch((err) => {
    console.log("Error getting user data");
    // If Authorization fails. It will show login prompt
    mixpanel.track("login_extension", {fromWhere: "get-user-endpoint" });
    showLoginPrompt();
    return;
  });
}

// Initialization function
$(document).ready(function () {
  // Send message to get selected text
  try {
    mixpanel.track("open_extension");
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      (tabs) => {
        // Get the current tab's URL
        const url = tabs[0].url;
        currSiteURL = url;

        checkSiteForSupport(url);

        // Also get stored variables from chrome storage
        chrome.storage.sync.get(["PENORA_USER_ID"]).then((result) => {
          popupUserId = result.PENORA_USER_ID;

          if (!popupUserId) {
            // showLoginPrompt();
            return;
          }

          chrome.storage.sync.get(["PENORA_ACCESS_TOKEN"]).then((result) => {
            accessToken = result.PENORA_ACCESS_TOKEN;
          });

          chrome.storage.sync.get(["PENORA_USER_EMAIL"]).then((result) => {
            userEmail = result.PENORA_USER_EMAIL;
            getUserData();
          });
        });

        chromeTabId = tabs[0].id;

        // On the active tab, call the content script
        chrome.tabs.sendMessage(
          tabs[0].id,
          { from: "penora-popup", subject: "getSelectedText" },
          handleGetSelectedTextResponse
        );
      }
    );
  } catch (e) {
    // If error, disable modal features
    disableModalFeatures(document, false);
    console.log(e);
  }

  // Add main modal listeners
  addMainModalListeners(document, false);
});

// Handle the response from the content script's get selected text
const handleGetSelectedTextResponse = (data) => {
  if (!data || data.length === 0) {
    disableModalFeatures(document, false);
  }

  currSelectedText = data;

  // Only if curr selected text, add these listeners
  if (data) {
    addRewriteListeners(document, false, getModalWrapper());
    addTLDRListeners(document, false, getModalWrapper());
    setDefaultModalTab();
  }
};

/**
 * IMPORTANT: whenever new sites are added / found as supported,
 * add them to the corresponding array variables in this function
 * Checks the current url for various supports:
 * isWritingSite
 * isTextInsertionSupported
 * @param {*} url
 */
const checkSiteForSupport = (url) => {
  try {
    const WRITING_SITES = [
      "docs.google.com",
      "docs.microsoft.com",
      "mail.google.com",
      "onenote.com",
      "outlook.live.com",
      "outlook.office.com",
      "outlook.office365.com",
      "outlook.com",
      "openai.com",
    ];

    const TEXT_INSERTION_SITES = [
      "docs.google.com",
      "mail.google.com",
      "yellowdig",
    ];

    for (let i = 0; i < WRITING_SITES.length; i++) {
      // check if it's a writing site
      if (url.includes(WRITING_SITES[i])) {
        isWritingSite = true;
      }

      // check if it's a text insertion site
      if (
        i < TEXT_INSERTION_SITES.length &&
        url.includes(TEXT_INSERTION_SITES[i])
      ) {
        isTextInsertionSupported = true;
      }
    }
  } catch (e) {
    // do nothing
  }
};

const didUserUpgrade = () => {
  const didUpgrade = localStorage.getItem("didUpgrade")
  if (userData.currPlan && userData.currPlan.length > 0 && didUpgrade == null) {
    localStorage.setItem("didUpgrade", "true")
    mixpanel.track("User Upgraded", { "Plan": String(userData.currPlan) });
  }
}
const setupSettingsPage = () => {
  let domain = "";

  // Add click listener to penora-settings-top-right
  document
    .getElementById("penora-settings-top-right")
    .addEventListener("click", () => {
      mixpanel.track("settings_click_extension");
      document.getElementById("penora-settings").style.display = "block";

      // hide the rest of the modal
      document.getElementById("penora-modal-body").style.display = "none";
    });

  // Add listener for settings back button
  document
    .getElementById("penora-settings-back")
    .addEventListener("click", () => {
      // hide upgrade prompt
      document.getElementById("penora-settings").style.display = "none";

      // show the rest of the modal
      document.getElementById("penora-modal-body").style.display = "block";
    });

  try {
    // Extract domain fro murl
    const urlObj = new URL(currSiteURL);
    domain = urlObj.hostname;

    // Display current domain
    document.getElementById("penora-settings-domain-label").innerHTML = domain;
  } catch {
    // hide the elements if not a valid domain
    document.getElementById("penora-settings-disable-row").style.display = "none";
  }

  // Set values of other elements
  document.getElementById("penora-settings-email-label").innerHTML = userEmail;
  document.getElementById("penora-settings-tokens-label").innerHTML = `${userData.currTokensLeft}`;

  // Get chrome storage of disabled websites
  chrome.storage.sync.get(["PENORA_DISABLED_SITES"]).then((result) => {
    const disabledSites = result.PENORA_DISABLED_SITES || [];

    // If the current site is in the disabled sites list, then set the toggle to off
    if (disabledSites.includes(domain)) {
      document.getElementById("penora-disable-site-switch").checked = false;
    }
  });

  // Listener to feedback click
  document.getElementById("feedback").addEventListener("click", (event) => {
    mixpanel.track("feedback_click_extension");
  })

  // Add switch listener to penora-enable-switch
  document
    .getElementById("penora-disable-site-switch")
    .addEventListener("change", (event) => {
      mixpanel.track("google_doc_conch_enable_extension", {enable: event.target.checked});
      // Get the current value of the toggle
      const toggleValue = event.target.checked;

      // Get the current disabled sites from chrome storage
      chrome.storage.sync.get(["PENORA_DISABLED_SITES"]).then((result) => {
        let disabledSites = result.PENORA_DISABLED_SITES || [];

        let messageSubjectToContetScript;

        // If the toggle is on, remove the current site from the disabled sites list
        if (toggleValue) {
          disabledSites = disabledSites.filter((site) => site !== domain);
          messageSubjectToContetScript = "enableOnSite";
        } else {
          // Otherwise add to the disabled sites list
          disabledSites.push(domain);
          messageSubjectToContetScript = "disableOnSite";
        }

        // Set the new disabled sites list in chrome storage
        chrome.storage.sync.set({ PENORA_DISABLED_SITES: disabledSites });

        // Send message to content script to disable / enable the extension
        chrome.tabs.query(
          {
            active: true,
            currentWindow: true,
          },
          (tabs) => {
            // On the active tab, call the content script
            chrome.tabs.sendMessage(
              tabs[0].id,
              { from: "penora-popup", subject: messageSubjectToContetScript });
          }
        );
      });
    });

  // see if they are on a plan
  const onPlan = userData.currPlan && userData.currPlan.length > 0;

  // add listener to penora-upgrade-prompt-button
  document
    .getElementById("penora-settings-upgrade-button")
    .addEventListener("click", () => {
      mixpanel.track("manage_account_extension");
      if (onPlan) {
        mixpanel.track("”upgradeToYearly”")
        // open the upgrade page
        window.open("https://billing.stripe.com/p/login/bIY6opa1Pa4veEU4gg", "_blank");
      } else {
        mixpanel.track("upgradeClickedSettings")
        // open the upgrade page
        window.open("https://getconch.ai/upgrade?from=extension", "_blank");
      }
    });

  // see if user has paid plan
  if (userData.currPlan && userData.currPlan.length > 0) {
    mixpanel.people.set({ "Plan": String(userData.currPlan) })


    document.getElementById("penora-settings-plan-label").innerHTML = "You're on a paid plan 😎"

    // hide penora-upgrade-top-right button everywhere
    document.getElementById("penora-upgrade-top-right").style.display = "none";

    // Show Manage Account
    document.getElementById("penora-settings-upgrade-button").innerHTML = "Manage Account";

  } else {
    // show top-right upgrade button everywhere by removing penora-hidden to class list of penora-upgrade-top-right
    document.getElementById("penora-upgrade-top-right").classList.remove("penora-hidden");
  }
};


/* UTILS */

/**
 * Global function used to make post requests
 * @param {*} url - url to make post request to
 * @param {*} payload - does not userId added to it, this function adds it
 * @returns
 */
function makePostRequest(url, payload) {
  // Add userId to post requests
  payload = {
    ...payload,
    userId: popupUserId,
  };

  console.log("PAYLOAD: ");
  console.log(payload);

  return $.post(url, payload).then((data) => data).catch((error) => {
    // check status code == 402 of error
    if (error.status === 402) {
      hideAllLoaders();
      showUpgradePrompt();
      return;
    }

    if (error.status === 401) {
    mixpanel.track("login_extension", {fromWhere: `${url} - endpoint` });
      showLoginPrompt();
      return;
    }

    console.error("Error making post request:");
    console.error(error);
  });;
}

const closePopup = () => {
  window.close();
};

function hideAllLoaders() {
  const document = getModalWrapper();

  const loaders = document.querySelectorAll(".penora-loader");
  for (let i = 0; i < loaders.length; i++) {
    loaders[i].style.display = "none";
  }
}

// Show all penora-loader
function showAllLoaders() {
  const document = getModalWrapper();

  const loaders = document.querySelectorAll(".penora-loader");
  for (let i = 0; i < loaders.length; i++) {
    loaders[i].style.display = "block";
  }
}

// Disable all buttons
function disableAllButtons() {
  const document = getModalWrapper();

  const buttons = document.querySelectorAll(".penora-button");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = true;
  }
}

const copyToClipboard = (text) => {
  mixpanel.track("copy_extension");

  navigator.clipboard
    .writeText(text)
    .then(() => {
      closePopup();
    })
    .catch((err) => {
      console.log("ERROR COPYING TEXT!");
    });
};

const extractMainContent = async () => {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject the Readability.js script
    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ["Readability.js"],
    });

    // Execute the extractMainContent function
    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      function: extractMainContentInTab,
    });

    return results[0].result;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const extractMainContentInTab = () => {
  // Check if the Readability object is available
  if (typeof Readability !== 'undefined') {
    // Create a new DOMParser instance to parse the current document
    const docClone = new DOMParser().parseFromString(document.documentElement.outerHTML, 'text/html');

    // Create a new Readability instance with the cloned document
    const article = new Readability(docClone).parse();

    // Check if the article object is valid and has content
    if (article && article.content) {
      // Create a new DOM element to store the content
      const contentElement = document.createElement('div');
      contentElement.innerHTML = article.content;

      // Return the text content of the element
      return contentElement.textContent;
    }
  }

  return null;
};


/*  CODE COPIED FROM scripts/script.js */

/* Modal */

const addMainModalListeners = (customDocument, isIframe) => {
  let documentToUse = document;

  // Add all listeners for the main modal
  addTabChangeListener();
  addConchListeners(customDocument, isIframe, getModalWrapper());
  addTemplatesGenerateListeners(customDocument, isIframe, getModalWrapper());
  addMiscUIListeners();
  addFinderListeners(customDocument, isIframe, getModalWrapper());


  // The other listeners are added if there is text selected
  // In the handleTextSelected function
};

const getModalWrapper = () => {
  return document;
};

const closeModal = () => {
  // do nothing
};

// disable modal features based on the data we have + current site
const disableModalFeatures = (customDocument, isIframe) => {
  const modalWrapper = getModalWrapper();

  if (!currSelectedText) {
    // disable the penora-tldr-generate-button and penora-rewrite-button
    const tldrGenerateButton = modalWrapper.getElementById(
      "penora-tldr-generate-button"
    );
    const rewriteButton = modalWrapper.getElementById("penora-rewrite-button");

    $("#penora-tldr-generate-button").attr("disabled", "disabled");
    $("#penora-rewrite-button").attr("disabled", "disabled");

    tldrGenerateButton.classList.add("penora-button-disabled");

    rewriteButton.classList.add("penora-button-disabled");

    // each element with class highlight-text-hint, set display to block
    const highlightTextHints = modalWrapper.querySelectorAll(
      ".highlight-text-hint"
    );
    for (let i = 0; i < highlightTextHints.length; i++) {
      highlightTextHints[i].style.display = "block";
    }

    // change .penora-bottom-left-icons-wide width to 58%
    const penoraIconsWide = modalWrapper.querySelectorAll(
      ".penora-bottom-left-icons-wide"
    );
    for (let i = 0; i < penoraIconsWide.length; i++) {
      penoraIconsWide[i].style.width = "58%";
    }

  }
};

/**
 * Process responses
 * @param {*} data
 * @param {*} type
 * @param {*} customDocument
 * @param {*} isIframe
 * Mixpanel => increment users tokens used variable
 */
const handleResponses = (response, type) => {
  hideAllLoaders();

  let tokens = 0

  try {
    // Mixpanel code
    if (type == "rewrite") {
      tokens = response[0].split("").length * 3;
    } else {
      tokens = response.split("").length;
    }
    mixpanel.people.increment("tokens_used", tokens);
  } catch (error) {
    console.log("Error incrementing tokens_used");
  }


  // Set the last generated text
  lastGeneratedText = response;
  mixpanel.track("tappedGenerateButton")
  switch (type) {
    case "conch":
      mixpanel.track("generateConch", { "responseLength": response.length });
      if (isTextInsertionSupported) {
        sendMessageToInsertText(response, type);
      } else {
        handleConchResponse(response);
      }
      break;
    case "rewrite":
      handleRewriteResponse(response);
      break;
    case "template":
      mixpanel.track("generateTemplate");
      if (isTextInsertionSupported) {
        sendMessageToInsertText(response, type);
      } else {
        handleTemplateResponse(response);
      }
      break;
    case "tldr":
      handleTLDRResponse(response);
      break;

    case "finder":
      handleFinderResponse(response);
      break;

    default:
      console.log("ERROR: Invalid type");
      break;
  }
};

/**
 * Add listeners for the QA tab in Modal
 */
const addRewriteListeners = (customDocument, isIframe, modalWrapper) => {
  // add click to listener to "penora-qa-answer-button" div
  modalWrapper
    .getElementById("penora-rewrite-button")
    .addEventListener("click", () => {
      // Show loading & disable all buttons
      showAllLoaders();
      disableAllButtons();

      // use the curr selected text as the query
      const query = currSelectedText;

      const length = modalWrapper.getElementById(
        "penora-rewrite-length-select"
      ).value;

      const tone = modalWrapper.getElementById(
        "penora-rewrite-tone-input"
      ).value;

      const isHumanizeSelected = modalWrapper.getElementById("humanize-checkbox").checked;
      
      if (isHumanizeSelected) {
        makePostRequest(`${BACKEND_URL}/ai/bypasser/bypass-paragraph-4-extension`, 
        {query, bypassFocus: "gptzero", accessToken, email: "virgo834@gmail.com"}
        )
          .then((response) => {
            // add a delay of 10 seconds here.
            setTimeout(() => {
              makePostRequest(`${BACKEND_URL}/ai/bypasser/get-bypass-paragraph-response`, { reqId: response})
              .then((res) => {
                mixpanel.track("rewrite_extension", {
                  humanizedText: true,
                  ResponseGenerated: true,
                  generateResponse: res,
                });
                handleResponses([res.response], "rewrite");
              })
            }, 10000);
          })
          .catch((err) => {
            console.log(err);
          })
      } else {
        // make jquery post request to backend
        makePostRequest(`${BACKEND_AI_URL}/rewrite`, { query, length, tone, accessToken })
          .then((response) => {
            mixpanel.track("generateRewrite", { "tone": String(tone), "length": String(length) });
            mixpanel.track("rewrite_extension", {
              rewriteLength: length,
              toneOfVoice: tone,
              cost: response[0].split("").length * 3,
              ResponseGenerated: true,
              generateResponse: response,
            });
            handleResponses(response, "rewrite");
          })
        .catch((err) => {
          console.log(err);
        });
      }
    });
};

const addFinderListeners = (modalWrapper) => {
  // Add click to listener to "extract-content" div
  modalWrapper
    .getElementById("extract-content")
    .addEventListener("click", async () => {
      // Show loading & disable all buttons
      showAllLoaders();
      disableAllButtons();

      // Extract the main content from the current page
      const long_text = await extractMainContent();

      // Check if text is longer than 44k characters and if so, shorten it to 44k
      const text = long_text.length > 44000 ? long_text.slice(0, 44000) : long_text;

      // Remove every "\n" from the text
      const clean_text = text.replace(/\n/g, ' ');

      // Get the query from the textarea
      const query = modalWrapper.getElementById("penora-finder-textarea").value;

      // Make jQuery post request to backend
      makePostRequest(`${BACKEND_AI_URL}/find`, { query, text: clean_text, accessToken })
        .then((response) => {
          mixpanel.track("finder_extension", {
            cost: response.split("").length,
            prompt: query,
            responseGenerated: true,
            generateResponse: response,
          });
          handleResponses(response, "finder");
        })
        .catch((err) => {
          handleResponses("I don't think the answer to this is on this page, so you shouldn't waste time looking for it here I think", "finder");
          console.log(err);
        });
    });
};

const handleRewriteResponse = (response) => {
  // hide .penora-rewrite-prompt
  document
    .querySelectorAll(".penora-rewrite-prompt")[0]
    .classList.add("penora-hidden");

  // remove penora-hidden class from .penora-rewrite-output
  document
    .querySelectorAll(".penora-rewrite-output")[0]
    .classList.remove("penora-hidden");

  // for each response, create a new div and add it to the .penora-rewrite-output div
  response.forEach((item) => {
    const div = document.createElement("div");
    const RESULT_HTML = `
    <div class="penora-row">
      <p class="penora-output">
        ${item}
      </p>
      <!-- TODO: if user presses copied icon, it should have small popup that says: Copied!                -->
      <div class="penora-copy-rewrite-button" value="${item}">
        <img src="chrome-extension://${EXTENSION_ID}/images/Copy.svg" class="penora-question"/> </img>
      </div>
    </div>
    <hr class="penora-divider solid" />
  `;
    div.innerHTML = RESULT_HTML;
    document.querySelectorAll(".penora-rewrite-output")[0].appendChild(div);
  });

  // add listener for copy buttons with class penora-copy-rewrite-button
  const copyButtons = document.querySelectorAll(".penora-copy-rewrite-button");

  for (let i = 0; i < copyButtons.length; i++) {
    const item = copyButtons[i];

    item.addEventListener("click", () => {
      mixpanel.track("copiedRewriteToClip");
      copyToClipboard(response[i]);
    });
  }

  // add back button functionality
  document
    .querySelector(".penora-rewrite-back")
    .addEventListener("click", () => {
      // hide .penora-rewrite-output
      document
        .querySelectorAll(".penora-rewrite-output")[0]
        .classList.add("penora-hidden");

      // remove penora-hidden class from .penora-rewrite-prompt
      document
        .querySelectorAll(".penora-rewrite-prompt")[0]
        .classList.remove("penora-hidden");

      hideAllLoaders();
    });
};

const handleFinderResponse = (response) => {
  // Hide input
  document.getElementById("penora-finder-container").style.display = "none";

  // Show output
  document.getElementById("penora-finder-output").style.display = "block";

  // Set #penora-magic-output-text to response
  document.getElementById("penora-finder-output-text").innerHTML = response;

  // add back button functionality
  document
    .getElementById("penora-finder-back-button")
    .addEventListener("click", () => {
      hideAllLoaders();

      // show .penora-finder-container
      document.getElementById("penora-finder-container").style.display =
        "block";

      // hide .penora-finder-output
      document.getElementById("penora-finder-output").style.display =
        "none";
    });

  // add copy button functionality
  document
    .querySelector("#penora-finder-copy-button")
    .addEventListener("click", () => {
      // copy the text to clipboard
      copyToClipboard(response);
    });

  // Send the found text to the content script to scroll to it
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { scrollToText: response });
  });
};



const handleTemplateResponse = (response) => {
  // Hide input
  document.getElementById("penora-" + currTemplate).style.display = "none";

  // Show output
  document.getElementById("penora-templates-output").style.display = "block";

  // Set #penora-magic-output-text to response
  document.getElementById("penora-templates-output-text").innerHTML = response;

  // Add listener to #penora-magic-back-button
  const backButton = document.getElementById("penora-templates-back-button");

  // Add back button functionality
  backButton.addEventListener("click", () => {
    hideAllLoaders();
    mixpanel.track("backToTemplateOptions");
    // Hide #penora-magic-output
    document.getElementById("penora-templates-output").style.display = "none";

    const sidebar = document.getElementById("penora-sidebar");
    const tempContainer = document.getElementById("penora-templates");

    // Show options section
    sidebar.style.height = "218px";
    tempContainer.classList.remove("penora-tempLarge");
    tempContainer.classList.add("templatesLarge");
    // hide the input section by enabling display
    document.getElementById("penora-" + currTemplate).style.display = "none";

    // show penora-templates-options-section
    document.getElementById("penora-templates-options-section").style.display =
      "flex";
  });

  // Add copy listener to #penora-magic-copy-button
  const copyButton = document.querySelector("#penora-templates-copy-button");
  copyButton.addEventListener("click", () => {
    // Copy response to clipboard
    mixpanel.track("copyTemplateToClip");
    copyToClipboard(response);
  });
};

const handleTemplateGenerateButtonClick = (
  customDocument,
  isIframe,
  modalWrapper
) => {
  // Show loading & disable all buttons
  showAllLoaders();
  disableAllButtons();

  // outline inputs
  const outlineThesis = modalWrapper.getElementById(
    "penora-templates-thesis-input"
  ).value;
  const outlineTone = modalWrapper.getElementById(
    "penora-templates-tone-input"
  ).value;

  // response inputs
  const responseText = modalWrapper.getElementById(
    "penora-templates-response-textarea"
  ).value;
  const responseKeyInfo = modalWrapper.getElementById(
    "penora-templates-key-info-input"
  ).value;
  const responseTone = modalWrapper.getElementById(
    "penora-templates-response-tone-input"
  ).value;

  // intro inputs
  const introPoints = modalWrapper.getElementById(
    "penora-templates-intro-points-textarea"
  ).value;
  const introThesis = modalWrapper.getElementById(
    "penora-templates-intro-thesis-input"
  ).value;
  const introTone = modalWrapper.getElementById(
    "penora-templates-intro-tone-input"
  ).value;

  // conclusion inputs
  const conclusionPoints = modalWrapper.getElementById(
    "penora-templates-conclusion-points-textarea"
  ).value;
  const conclusionThesis = modalWrapper.getElementById(
    "penora-templates-conclusion-thesis-input"
  ).value;
  const conclusionTone = modalWrapper.getElementById(
    "penora-templates-conclusion-tone-input"
  ).value;

  // Depending on the currTemplate, collect different inputs and handle process
  switch (currTemplate) {
    case "outline":
      makePostRequest(`${BACKEND_AI_URL}/generate-outline`, {
        thesis: outlineThesis,
        tone: outlineTone,
        accessToken
      })
        .then((response) => {
          closeModal();
          mixpanel.track("generatedOutline", { tone: outlineTone });
          mixpanel.track("outline_generator_extension", {
            cost: response.split("").length,
            mainThesis: outlineThesis,
            toneOfVoice: outlineTone,
            prompt: outlineThesis,
            responseGenerated: true,
            generateResponse: response
          });
          handleResponses(response, "template");
        })
        .catch((err) => {
          console.log(err);
        });
      break;
    case "response":
      makePostRequest(`${BACKEND_AI_URL}/generate-response`, {
        query: responseText,
        info: responseKeyInfo,
        tone: responseTone,
        accessToken
      })
        .then((response) => {
          closeModal();
          mixpanel.track("generateResponse", { tone: outlineTone });
          mixpanel.track("response_extension", {
            cost: response.split("").length,
            keyInformation: responseKeyInfo,
            toneOfVoice: responseTone,
            prompt: responseText,
            responseGenerated: true,
            generateResponse: response
          });
          handleResponses(response, "template");
        })
        .catch((err) => {
          console.log(err);
        });
      break;
    case "intro":
      makePostRequest(`${BACKEND_AI_URL}/generate-intro`, {
        points: introPoints,
        thesis: introThesis,
        tone: introTone,
        accessToken
      })
        .then((response) => {
          closeModal();
          mixpanel.track("generateIntro", { tone: introTone });
          mixpanel.track("essay_blog_intro_extension", {
            cost: response.split("").length,
            mainThesis: introThesis,
            toneOfVoice: introTone,
            prompt: introThesis,
            responseGenerated: true,
            generateResponse: response
          });
          handleResponses(response, "template");
        })
        .catch((err) => {
          console.log(err);
        });
      break;
    case "conclusion":
      makePostRequest(`${BACKEND_AI_URL}/generate-conclusion`, {
        points: conclusionPoints,
        thesis: conclusionThesis,
        tone: conclusionTone,
        accessToken
      })
        .then((response) => {
          closeModal();
          mixpanel.track("generateConclusion", { tone: conclusionTone });
          mixpanel.track("essay_blog_conclusion_extension", {
            cost: response.split("").length,
            mainThesis: conclusionThesis,
            toneOfVoice: conclusionTone,
            prompt: conclusionThesis,
            responseGenerated: true,
            generateResponse: response
          });
          handleResponses(response, "template");
        })
        .catch((err) => {
          console.log(err);
        });
      break;
    default:
    // do nothing
  }
};

const addConchListeners = (customDocument, isIframe, modalWrapper) => {
  const conchButton = modalWrapper.querySelector(
    "#penora-conch-generate-button"
  );

  const conchTextArea = modalWrapper.querySelector("#penora-conch-textarea");

  // if there is a value in localstorage, set the value of
  // penora-conch-textarea to the value in localstorage
  if (localStorage.getItem("penora-conch-textarea")) {
    conchTextArea.value = localStorage.getItem("penora-conch-textarea");
  }

  // add a listener to penora-conch-textarea and add its text
  // to localstorage each time it changes
  conchTextArea.addEventListener("input", () => {
    localStorage.setItem("penora-conch-textarea", conchTextArea.value);
  });

  conchButton.addEventListener("click", () => {
    // Show loading & disable all buttons
    showAllLoaders();
    disableAllButtons();

    // delete the value of penora-conch-textarea in localstorage
    localStorage.removeItem("penora-conch-textarea");

    // get query from penora-conch-textarea text area
    const query = conchTextArea.value;

    // get wordsToGenerate
    const wordsToGenerateSelect = modalWrapper.getElementById(
      "penora-conch-words-select"
    );
    const wordsToGenerate = parseInt(wordsToGenerateSelect.value);

    makePostRequest(`${BACKEND_AI_URL}/generate-custom`, { query, wordsToGenerate, accessToken })
      .then((reqId) => {
        console.log("Received request id: " + reqId);

        // Keep checking for response every X Seconds
        const POLLING_RATE = 3 * 1000;
        const MAX_POLLING_ATTEMPTS = 25;

        let pollingAttempts = 0;
        const interval = setInterval(() => {
          // If max polling attempts reached, stop polling
          if (pollingAttempts >= MAX_POLLING_ATTEMPTS) {
            clearInterval(interval);
            return;
          }

          // Make request to check if response is ready
          makePostRequest(`${BACKEND_AI_URL}/get-conch-response`, { reqId, accessToken })
            .then((response) => {
              // If a response is retrieved and processed = true, stop polling
              if (response && response.processed) {
                console.log("RESPONSE RECEIVED!");
                console.log(response);
                mixpanel.track("the_conch_generate_extension", {
                  wordsSelected: wordsToGenerate,
                  prompt: query,
                  responseGenerated: response.processed,
                  cost: response.response.split("").length,
                });

                // Clear interval
                clearInterval(interval);
                // Handle response
                handleResponses(response.response, "conch");
              } else {
                console.log("Response not ready yet");

              }
            })
            .catch((err) => {
              console.log(err);
            });

          // Increment polling attempts
          pollingAttempts++;
        }, POLLING_RATE);

        // insertTextIntoFocusedElement(response, customDocument, isIframe);
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

const handleConchResponse = (response) => {
  // Hide #penora-magic-input
  document
    .querySelectorAll("#penora-magic-input")[0]
    .classList.add("penora-hidden");

  // Show #penora-magic-output
  document
    .querySelectorAll("#penora-magic-output")[0]
    .classList.remove("penora-hidden");

  // Set #penora-magic-output-text to response
  document.querySelectorAll("#penora-magic-output-text")[0].innerHTML =
    response;

  // Add listener to #penora-magic-back-button
  const backButton = document.querySelector("#penora-magic-back-button");
  backButton.addEventListener("click", () => {
    hideAllLoaders();

    // Hide #penora-magic-output
    document
      .querySelectorAll("#penora-magic-output")[0]
      .classList.add("penora-hidden");

    // Show #penora-magic-input
    document
      .querySelectorAll("#penora-magic-input")[0]
      .classList.remove("penora-hidden");
  });

  // Add copy listener to #penora-magic-copy-button
  const copyButton = document.querySelector("#penora-magic-copy-button");
  copyButton.addEventListener("click", () => {
    // Copy response to clipboard
    mixpanel.track("copyConchToClip");
    copyToClipboard(response);
  });
};

/**
 * Add listeners for template tab
 * @param {*} modalWrapper
 * @param {*} isIframe
 */
const addTemplatesGenerateListeners = (
  customDocument,
  isIframe,
  modalWrapper
) => {
  // add listenrs to penora-template-option
  const templateOptions = modalWrapper.querySelectorAll(
    ".penora-template-option"
  );

  const sidebar = modalWrapper.getElementById("penora-sidebar");
  const tempContainer = modalWrapper.getElementById("penora-templates");
  for (let i = 0; i < templateOptions.length; i++) {
    const item = templateOptions[i];

    // get id of div to enable
    const templateType = item.getAttribute("value");
    const inputSectionId = "penora-" + templateType;

    item.addEventListener("click", () => {
      // mixpanel events
      if (templateType === outlineTemplate) {
        mixpanel.track("online_generator_click_extension");
      }

      if (templateType === responseTemplate) {
        mixpanel.track("response_click_extension");
      }

      if (templateType === introTemplate) {
        mixpanel.track("essay_blog_intro_click_extension");
      }

      if (templateType === conclusionTemplate) {
        mixpanel.track("essay_blog_conclusion_click_extension");
      }


      // set the curr template being handled
      sidebar.style.height = "280px";
      currTemplate = templateType;
      tempContainer.classList.remove("templatesLarge");
      tempContainer.classList.add("penora-tempLarge");
      // show the input section by enabling display
      modalWrapper.getElementById(inputSectionId).style.display = "block";

      // hide penora-templates-options-section
      modalWrapper.getElementById(
        "penora-templates-options-section"
      ).style.display = "none";
    });
  }

  // add click to listener to all "penora-templates-generate-button" div
  const generateButtons = modalWrapper.querySelectorAll(
    ".penora-templates-generate-button"
  );

  // Add the listener to each button
  for (let i = 0; i < generateButtons.length; i++) {
    const item = generateButtons[i];

    // Add click listener to each generate button part of a template
    item.addEventListener("click", () => {
      handleTemplateGenerateButtonClick(customDocument, isIframe, modalWrapper);

    });
  }

  // Add back button listener to #penora-templates-back-button
  const backButtons = modalWrapper.querySelectorAll(
    ".penora-templates-back-button"
  );

  for (let i = 0; i < backButtons.length; i++) {
    const backButton = backButtons[i];

    backButton.addEventListener("click", () => {
      sidebar.style.height = "218px";
      tempContainer.classList.remove("penora-tempLarge");
      tempContainer.classList.add("templatesLarge");
      // hide the input section by enabling display
      modalWrapper.getElementById("penora-" + currTemplate).style.display =
        "none";

      // show penora-templates-options-section
      modalWrapper.getElementById(
        "penora-templates-options-section"
      ).style.display = "flex";
    });
  }
};

/**
 * Add listeners for the QA tab in Modal
 */
const addTLDRListeners = (customDocument, isIframe, modalWrapper) => {
  console.log("ADDING TLDR LISTENER");
  // add click to listener to "penora-qa-answer-button" div
  modalWrapper
    .querySelector("#penora-tldr-generate-button")
    .addEventListener("click", () => {
      // Show loading & disable all buttons
      showAllLoaders();
      disableAllButtons();

      // use the curr selected text as the query
      const query = currSelectedText;

      // tldr inputs
      const tldrLength = modalWrapper.getElementById(
        "penora-tldr-length-select"
      ).value;
      const tldrOutputGradeLevel = modalWrapper.getElementById(
        "penora-tldr-grade-level-input"
      ).value;

      // make jquery post request to backend
      makePostRequest(`${BACKEND_AI_URL}/generate-tldr`, {
        query,
        length: tldrLength,
        outputGradeLevel: tldrOutputGradeLevel,
        accessToken
      })
        .then((response) => {
          mixpanel.track("generateTLDR", { "outputGradeLevel": String(tldrOutputGradeLevel), "length": String(tldrLength) });
          mixpanel.track("summarizer_extension", {
            sentences: length,
            outputGradeLevel: tldrOutputGradeLevel,
            prompt: query,
            responseGenerated: true,
            generatedResponse: response,
            cost: response.split("").length,
          });
          handleResponses(response, "tldr");
        })
        .catch((err) => {
          console.log(err);
        });
    });
};

const handleTLDRResponse = (response) => {
  // hide .tldr-input-container
  document.querySelector(".penora-tldr-input-container").style.display = "none";

  // show .tldr-output-container
  document.querySelector(".penora-tldr-output-container").style.display =
    "block";

  // insert the text into #tldr-output-text
  document.querySelector("#penora-tldr-output-text").innerHTML = response;

  // add back button functionality
  document
    .querySelector("#penora-tldr-back-button")
    .addEventListener("click", () => {
      hideAllLoaders();

      // show .tldr-input-container
      document.querySelector(".penora-tldr-input-container").style.display =
        "block";

      // hide .tldr-output-container
      document.querySelector(".penora-tldr-output-container").style.display =
        "none";
    });

  // add copy button functionality
  document
    .querySelector("#penora-tldr-copy-button")
    .addEventListener("click", () => {
      // copy the text to clipboard
      mixpanel.track("copyTLDRtoClip");
      copyToClipboard(response);
    });
};

const formatDateToMMDDYYYY = (date) => {
  date = new Date(date);

  // convert date to day of week
  var dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // get the day of the week
  var day = dayOfWeek[date.getDay()];

  // get hh:mm
  var hours = date.getHours();
  var minutes = date.getMinutes();

  // convert to 12 hour time
  var ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;


  return day + " " + hours + " " + ampm;
}
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Handle setting up the history page when it is clicked on
 */
const setupHistoryPage = () => {
  mixpanel.track("history_button_click");
  // empty the penora-history-container div
  document.querySelectorAll(".penora-history-container")[0].style.display = "flex";
  document.querySelector(".penora-history-container").innerHTML = `<div class="penora-loader" style="display: flex; margin: auto;"></div>`;


  // get user history data
  const historyUrl = `${BACKEND_URL}/auth/get-user-history`;
  makePostRequest(historyUrl, { userId: popupUserId, accessToken }).then((response) => {
    userHistory = response;

    let historyHTML = '';

    // for each response, create a new div and add it to the .penora-rewrite-output div
    userHistory.forEach((item) => {
      const div = document.createElement("div");
      const RESULT_HTML = `
        <div class="penora-row" style="height: auto; align-items: start; justify-content: space-between;">
          <div class="penora-history-col" style="width: 80%">
            <p class="penora-output penora-history-response">
              ${item.response}
            </p>
          </div>
          <!-- TODO: if user presses copied icon, it should have small popup that says: Copied! -->
          <div class="penora-copy-history-button" value="${item.response}" style="margin-left: 4rem">
            <img src="chrome-extension://${EXTENSION_ID}/images/Copy.svg" class="penora-question"/> </img>
          </div>
        </div>
        <p class="penora-history-item-details">
          <span class="">${capitalizeFirstLetter(item.type)} | ${item.tokensUsed} tokens | ${formatDateToMMDDYYYY(item.dateGenerated)} </span>
        </p>
        <hr class="penora-divider solid"  />
      `;
      historyHTML += RESULT_HTML;
    });

    // set history html
    document.querySelector(".penora-history-container").innerHTML = historyHTML;

    // add click listener to all the copy buttons to copy the response text to clipboard
    const copyButtons = document.querySelectorAll(".penora-copy-history-button");
    for (let i = 0; i < copyButtons.length; i++) {
      const item = copyButtons[i];

      item.addEventListener("click", () => {
        mixpanel.track("copiedRewriteToClip");
        copyToClipboard(response[i].response);
      });
    }


  }).catch((err) => {
    // In case authorization fails.
    mixpanel.track("login_extension", {fromWhere: "get-user-history-endpoint" });
    showLoginPrompt();
    return;
  });
}

/**
 * Handle changing tabs on the left hand side
 */
const addTabChangeListener = () => {
  const tabs = document.querySelectorAll("[data-tab-target]");
  const tabContents = document.querySelectorAll("[data-tab-content]");
  const tempContainer = document.getElementById("penora-templates");

  const sidebar = document.getElementById("penora-sidebar");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      prevTab = currTab;
      currTab = tab.dataset.tabTarget;
      
      if (tab.dataset.tabTarget === ONBOARDINGTAB) {
        mixpanel.track("onboarding_page", { fromWhere: prevTab || "" });
        mixpanel.track("the_conch_click_extension");
      }

      if (tab.dataset.tabTarget === REWRITETAB) {
        mixpanel.track("rewrite_click_extension");
      }

      if (tab.dataset.tabTarget === TLDRTAB) {
        mixpanel.track("summarizer_click_extension");
      }

      if (tab.dataset.tabTarget === TEMPLATETAB) {
        mixpanel.track("template_click_extension");
      }

      mixpanel.track("clicked_tab" + tab.dataset.tabTarget);

      // Hide / show upgrade in top right depending on tab
      if (tab.dataset.tabTarget == "#penora-settings") {
        // Add penora-hidden to #penora-upgrade-top-right
        document.getElementById("penora-upgrade-top-right").classList.add(
          "penora-hidden"
        );
      } else if ((userData && !userData.currPlan) || (userData && userData.currPlan && userData.currPlan.length == 0)) {
        // Otherwise, for other tabs, if user is not premium, show upgrade

        // Remove penora-hidden from #penora-upgrade-top-right
        document.getElementById("penora-upgrade-top-right").classList.remove(
          "penora-hidden"
        );
      }

      // Handle history tab
      if (tab.dataset.tabTarget == "#penora-history") {
        // Hide settings button
        document.getElementById("penora-settings-top-right").classList.remove(
          "penora-hidden"
        );

        // Hide upgrade button
        document.getElementById("penora-upgrade-top-right").classList.add(
          "penora-hidden"
        );

        setupHistoryPage();
      } else {
        // not history, hide settings button
        document.getElementById("penora-settings-top-right").classList.add(
          "penora-hidden"
        );
      }

      if (
        tempContainer.classList.contains("penora-tempLarge") &&
        tab.dataset.tabTarget == "#penora-templates"
      ) {
        sidebar.style.height = "278px";
      } else {
        sidebar.style.height = "218px";
      }
      const target = document.querySelector(tab.dataset.tabTarget);
      tabContents.forEach((tabContent) => {
        tabContent.classList.remove("penora-nav-selected");
      });
      tabs.forEach((tab) => {
        tab.classList.remove("penora-nav-selected");
      });
      tab.classList.add("penora-nav-selected");
      target.classList.add("penora-nav-selected");
    });
  });
};


/**
 * Misc UI listeners for elements that don't belong to any specific tab
 */
const addMiscUIListeners = () => {
  // add click listener to #penora-upgrade-top-right
  document
    .querySelector("#penora-upgrade-top-right")
    .addEventListener("click", () => {
      // Handle upgrade
      mixpanel.track("clicked_upgrade_top_right", { "currTab": String(currTab) });
      window.open("https://getconch.ai/upgrade?from=extension", "_blank");
    });
}

/**
 * Based on the current selected text, set the default tab
 */
const setDefaultModalTab = () => {
  // if there's selected text
  if (currSelectedText) {
    // if the current site is a writing site
        if (isWritingSite) {
      // set the default tab to the tldr tab
      document.querySelector("#penora-rewrite-tab").click();
    } else {
      // set the default tab to the rewrite tab
      document.querySelector("#penora-tldr-tab").click();
    }
  }
};

/**
 * Send request to content script to insert text
 * @param {*} text
 */
const sendMessageToInsertText = (text, type) => {
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    (tabs) => {
      // Divide text into sentences
      let sentences = text.match(/[^\.!\?]+[\.!\?]+/g);

      if (!sentences && text) {
        // division didn't work
        sentences = [text];
      }

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        console.log("SENDING MESSAGE!");
        chrome.tabs.sendMessage(
          tabs[0].id,
          { from: "penora-popup", subject: "insertText", text: sentence },
          (response) => handleInsertTextResponse(response, type)
        );
      }
    }
  );
};

/**
 * Handle response from content script for inserting text
 * @param {*} response
 */
const handleInsertTextResponse = (response, type) => {
  if (response == null) {
    console.error(
      "ERROR - response from content script for inserting text is null"
    );
  }

  if (type == "conch") {
    handleConchResponse(lastGeneratedText);
  } else if (type == "template") {
    handleTemplateResponse(lastGeneratedText);
  }
};


/* ********* UPGRADE PROMPT ********* */
function showUpgradePrompt() {
  mixpanel.track("showUpgradePrompt");
  // show upgrade prompt
  document.getElementById("penora-upgrade-prompt").style.display = "block";

  // hide the rest of the modal
  document.getElementById("penora-modal-body").style.display = "none";

  // set the current plan text
  document.getElementById("penora-plan-type-label").innerText =
    userData.currPlan && userData.currPlan.length > 0 ? userData.currPlan : "Free Plan";

  // add listener to "penora-upgrade-prompt-back-button"
  document
    .getElementById("penora-upgrade-prompt-back-button")
    .addEventListener("click", () => {
      // hide upgrade prompt
      document.getElementById("penora-upgrade-prompt").style.display = "none";

      // show the rest of the modal
      document.getElementById("penora-modal-body").style.display = "block";
    });

  // add listener to penora-upgrade-prompt-button
  document
    .getElementById("penora-upgrade-prompt-button")
    .addEventListener("click", () => {
      // open the upgrade page
      mixpanel.track("tappedUpgradePromptButton");
      window.open("https://getconch.ai/upgrade?from=extension", "_blank");
    });
};

/* ********* LOGIN PROMPT ********* */
function showLoginPrompt() {
  mixpanel.track("showLogin");
  

  // show upgrade prompt
  document.getElementById("penora-login-prompt").style.display = "block";

  // hide the rest of the modal
  document.getElementById("penora-modal-body").style.display = "none";

  // add listener to penora-upgrade-prompt-button
  document
    .getElementById("penora-login-prompt-button")
    .addEventListener("click", () => {
      // open the upgrade page
      mixpanel.track("tappedLoginButton");
      window.open("https://getconch.ai/sign-up?from=extension", "_blank");
    });
};
