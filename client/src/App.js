import React, { Component } from 'react';
import './App.css';
import { AppProvider, Tabs, Card, Frame } from '@shopify/polaris';
import IndexPage from './layouts/IndexPage';
import Settings from './layouts/Settings';
import HowToUse from './layouts/HowToUse';

const tabs = [
  {
    id: 'locations',
    content: 'Locations',
    accessibilityLabel: 'All customers',
    panelID: <IndexPage />,
  },
  {
    id: 'settings',
    content: 'Settings',
    panelID: 'settings',
  },
  {
    id: 'guidelines',
    content: 'How to use',
    panelID: 'ez',
  },
];

const tabPanels = [
  (
    <Tabs.Panel id="locations">
      <IndexPage/>
    </Tabs.Panel>
  ),
  (
    <Tabs.Panel id="settings">
      <Settings/>
    </Tabs.Panel>
  ),
  (
    <Tabs.Panel id="guidelines">
      <HowToUse/>
    </Tabs.Panel>
  )
];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTab: 0,
    };
  }

  handleTabChange = (tabIndex) => {
    this.setState({
      selectedTab: tabIndex
    })
  }

  render() {
    const selected = this.state.selectedTab;
    
    return (

      <div className="App">

        <AppProvider>
        <Frame>
          <Tabs tabs={tabs} selected={selected} onSelect={this.handleTabChange}>
            <Card.Section >
              {tabPanels[selected]}
            </Card.Section>
          </Tabs>
          </Frame>
        </AppProvider>
       
      </div >
    );
  }
}

export default App;
