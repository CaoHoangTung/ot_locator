import React from 'react';
import { Page, Heading, Subheading, Card, Link} from '@shopify/polaris';

class HowToUse extends React.Component {
    render() {
        return (
            <Page>
                <Card>
                    <Heading>TABLE OF CONTENTS</Heading>
                    <Link url="#Overview">Overview</Link>
                    <Link url="#Overview">Overview</Link>
                    <Link url="#Overview">Overview</Link>
                    <Link url="#Overview">Overview</Link>
                    <Link url="#fees">Overview</Link>
                </Card>
                <Card id="overview">
                    <Subheading>Overview</Subheading>
                </Card>
                <Card id="setUpGoogleAPIKey">
                    <Heading>Set up a Google API Key</Heading>
                </Card> 
                <Card id="workingWithStores">
                    <Heading>Working around with stores</Heading>
                </Card>
                <Card id="settingsSection">
                    <Heading>Settings section</Heading>
                </Card>
                <Card id="fees">
                    <Heading>Fees</Heading>
                </Card>
                <Card id="stepByStepGuides">
                    <Heading>A complete step-by-step guide</Heading>
                </Card>
            </Page>
        )
    }
}

export default HowToUse