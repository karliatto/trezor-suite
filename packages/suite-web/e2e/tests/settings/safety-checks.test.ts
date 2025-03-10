// @group_settings
// @retry=2

describe('Safety Checks Settings', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/device').click();
    });

    it('There is button in device settings, that opens safety checks modal.', () => {
        cy.getTestElement('@settings/device/safety-checks-button').click({
            scrollBehavior: 'bottom',
        });
        cy.getTestElement('@safety-checks-apply');
    });

    it('Only one level is selected at a time', () => {
        // Open the safety checks modal.
        cy.getTestElement('@settings/device/safety-checks-button').click({
            scrollBehavior: 'bottom',
        });

        // There should be two radio buttons, one checked and one not.
        cy.get('[data-testid*="@radio-button"]').should('have.length', 2);
        cy.get('[data-testid*="@radio-button"][data-checked="true"]').should('have.length', 1);
        cy.get('[data-testid*="@radio-button"][data-checked="false"]').should('have.length', 1);

        cy.get('[data-testid*="@radio-button"][data-checked="false"]').click();
        // After switching the value, there should still be one checked and one unchecked.
        cy.get('[data-testid*="@radio-button"][data-checked="true"]').should('have.length', 1);
        cy.get('[data-testid*="@radio-button"][data-checked="false"]').should('have.length', 1);
    });

    it('Apply button is enabled only when value is changed', () => {
        // Open the safety checks modal.
        cy.getTestElement('@settings/device/safety-checks-button').click({
            scrollBehavior: 'bottom',
        });

        cy.getTestElement('@safety-checks-apply').should('have.attr', 'disabled');
        cy.get('[data-testid*="@radio-button"][data-checked="false"]').click();
        cy.getTestElement('@safety-checks-apply').should('not.have.attr', 'disabled');
    });

    it('Device safety_check setting is changed after pressing the apply button', () => {
        cy.getTestElement('@settings/device/safety-checks-button').click({
            scrollBehavior: 'bottom',
        });
        // Don't assume the device is set to any particular value.
        // Just switch to the one that is not currently checked.
        cy.get('[data-testid*="@radio-button"][data-checked="false"]')
            .click()
            .then(b => {
                const targetValue = b.attr('data-testid');
                console.log(`Changing safety_checks to ${targetValue})`);
                cy.getTestElement('@safety-checks-apply').click();
                cy.getTestElement('@prompts/confirm-on-device');
                cy.task('pressYes');

                cy.getTestElement('@settings/device/safety-checks-button').click({
                    scrollBehavior: 'bottom',
                });
                cy.get(`[data-testid="${targetValue}"]`)
                    .invoke('attr', 'data-checked')
                    .should('eq', 'true');
            });
    });
});

export {};
