// cypress/e2e/main-page.cy.ts

describe('메인 페이지 테스트', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('페이지가 정상적으로 로드되는지 확인', () => {
    cy.contains('메인 페이지 제목').should('be.visible');
  });

  it('네비게이션 메뉴가 있는지 확인', () => {
    cy.get('[data-testid="navigation"]').should('exist');
  });

  it('버튼 클릭 시 올바른 동작을 하는지 확인', () => {
    cy.get('[data-testid="main-button"]').click().should('have.class', 'active');
  });

  // 커스텀 명령어 사용 예시 (commands.ts에서 정의한 것)
  it('로그인 기능 테스트', () => {
    cy.login('testuser', 'password123'); // TypeScript에서 타입 체크됨
  });
});
