import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
  Navigation,
  staticClasses,
  SliderField
} from "@decky/ui";
import {
  addEventListener,
  removeEventListener,
  definePlugin,
  toaster,
  // routerHook
} from "@decky/api"
import { FaForward } from "react-icons/fa";

// import logo from "../assets/logo.png";

let doubleTapTimeout = 300;

let event_count = 0;

let focusedWindowInstance = {};

function Content() {
  return (
    <PanelSection title="Settings">
      <PanelSectionRow>
        <p>{"Time between two Steam button presses, in ms"}</p>
        <SliderField
          layout="below"
          step={50}
          value={doubleTapTimeout}
          min={100}
          max={1000}
          showValue={true}
          onChange={(val) => doubleTapTimeout = val}
        >
          {"Time between two Steam button presses, in milliseconds"}
        </SliderField>
      </PanelSectionRow>
    </PanelSection>
  );
};

function getRunningAppIndex() {
    let ra = window.SteamUIStore.RunningApps;

    for (let i = 0; i < ra.length; i++) {
        if (ra[i].appid == window.SteamUIStore.MainRunningAppID) {
            return i;
        }
    }
    return -1;
}

function navigateToggle() {
    switch (window.SteamUIStore.RunningApps.length) {
    case 0: // No app running: go Home, go to Library from Home
        if (focusedWindowInstance.m_history.location.pathname == "/library/home") {
            Navigation.NavigateToLibraryTab();
        } else {
            Navigation.Navigate("/library/home");
        }
    case 1: // One app running: go to App, go Home from App
        if (focusedWindowInstance.m_history.location.pathname == "/apprunning") {
            Navigation.Navigate("/library/home");
        } else {
            Navigation.Navigate("/apprunning");
        }
    default: // More apps running: cycle between Apps
        let ra = window.SteamUIStore.RunningApps;
        let nextIndex = (getRunningAppIndex() + 1) % ra.length;
        window.SteamUIStore.SetRunningApp(ra[nextIndex].appid);
    }

    setTimeout(Navigation.CloseSideMenus, 10)
}

export default definePlugin(() => {
  console.log("Template plugin initializing, this is called once on frontend startup")

  focusedWindowInstance = window.SteamUIStore.GetFocusedWindowInstance();
  SteamClient.System.UI.RegisterForSystemKeyEvents((m) => {
    if (!m.eKey == 0) return;

    if (event_count == 0) {
      setTimeout(() => { event_count = 0; }, doubleTapTimeout);
    }
    event_count ++;
    if (event_count == 2) {
      navigateToggle();
    }
  });

  // serverApi.routerHook.addRoute("/decky-plugin-test", DeckyPluginRouterTest, {
  //   exact: true,
  // });

  // Add an event listener to the "timer_event" event from the backend
  const listener = addEventListener<[
    test1: string,
    test2: boolean,
    test3: number
  ]>("timer_event", (test1, test2, test3) => {
    console.log("Template got timer_event with:", test1, test2, test3)
    toaster.toast({
      title: "template got timer_event",
      body: `${test1}, ${test2}, ${test3}`
    });
  });

  return {
    // The name shown in various decky menus
    name: "RocketJump",
    // The element displayed at the top of your plugin's menu
    titleView: <div className={staticClasses.Title}>RocketJump</div>,
    // The content of your plugin's menu
    content: <Content />,
    // The icon displayed in the plugin list
    icon: <FaForward />,
    // The function triggered when your plugin unloads
    onDismount() {
      console.log("Unloading")
      removeEventListener("timer_event", listener);

      // Since RegisterForSystemKeyEvents does not return an unregister method,
      // doing this essentially disarms our callback for this instance.
      focusedWindowInstance = {};
      // serverApi.routerHook.removeRoute("/decky-plugin-test");
    },
  };
});
