// cypress/support/commands.ts

// 기존 내용 유지하고 아래에 추가
declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>;
      // 다른 커스텀 명령어들의 타입 정의
    }
  }
}

Cypress.Commands.add('login', (username: string, password: string) => {
  cy.get('[data-testid="username"]').type(username);
  cy.get('[data-testid="password"]').type(password);
  cy.get('[data-testid="login-button"]').click();
});

// 빈 export로 모듈화
export {};
