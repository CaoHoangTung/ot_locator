import React, { Component } from 'react';
import './App.css';
import { AppProvider, Tabs, Card, Frame } from '@shopify/polaris';
import IndexPage from './layouts/IndexPage';
import Settings from './layouts/Settings';
import OldSettings from './layouts/OldSettings';
import HowToUse from './layouts/HowToUse';
import ImportExport from './layouts/ImportExport';
import Layouts from './layouts/Layouts';

const tabs = [
  {
    id: 'locations',
    content: 'Locations',
    accessibilityLabel: 'All customers',
  },
  {
    id: 'settings',
    content: 'Settings',
  },
  {
    id: 'old',
    content: 'Stts',
  },
  {
    id: 'importexport',
    content: 'Import & Export',
  },
  {
    id: 'layouts',
    content: 'Layouts',
  },
  {
    id: 'guidelines',
    content: 'How to use',
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
    <Tabs.Panel id="importexport">
      <ImportExport/>
    </Tabs.Panel>
  ),
  (
    <Tabs.Panel id="old">
      <OldSettings/>
    </Tabs.Panel>
  ),
  (
    <Tabs.Panel id="layouts">
      <Layouts/>
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
