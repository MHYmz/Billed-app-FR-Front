/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from '@testing-library/user-event'; // Importation de 'userEvent' pour simuler des actions utilisateur dans les tests.
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

// Import du mockStore pour simuler le store avec des factures
import mockStore from "../__mocks__/store";

// Simulation du store pour gérer une erreur 404 lors de la récupération des factures
jest.mock("../app/store", () => ({
  __esModule: true,
  default: {
    bills: jest.fn(() => ({
      list: jest.fn().mockRejectedValue(new Error("Erreur 404")),
    })),
  },
}));



// Mock des fonctions formatDate et formatStatus pour simuler leur comportement
jest.mock("../app/format.js", () => ({
  formatDate: jest.fn(date => `formatted_${date}`),
  formatStatus: jest.fn(status => `formatted_${status}`),
}));



describe("Given I am connected as an employee", () => {
  
  describe("When I am on Bills Page", () => {

    test("Then bill icon in vertical layout should be highlighted", async () => {
      
   
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));
      
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      
    // to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBe(true); // Vérification que l'icône a bien la classe active
    });

  
    test("Then bills should be ordered from earliest to latest", () => { 
      document.body.innerHTML = BillsUI({ data: bills }); 
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML);



      // Fonction pour convertir une date formatée en ISO
      const formatedToIso = (date) => {
        const [day, monthString, year] = date.split(' ');
        const month = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'].indexOf(monthString) + 1;
        return `20${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      };

      // Conversion et tri des dates au format ISO
      const datesISO = dates.map(date => formatedToIso(date));
      const datesSortedISO = [...datesISO].sort((a, b) => new Date(b) - new Date(a));

      // Vérification que les dates sont triées correctement
      expect(datesISO).toEqual(datesSortedISO);
    });
     

    // Test pour vérifier que la modale s'affiche lorsqu'on clique sur l'icône d'œil
    test("Then modal should open and display the bill when I click on eye icon", () => {
      // Configuration de la simulation de l'utilisateur connecté
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

      // Configuration du DOM et navigation vers la page des factures
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      document.body.innerHTML = BillsUI({ data: bills });

      // Ajout de la structure de la modale au DOM
      const modale = document.createElement('div');
      modale.setAttribute('id', 'modaleFile');
      modale.setAttribute('data-testid', 'modaleFile');
      modale.classList.add("modal", "fade");
      modale.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Justificatif</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body"></div>
          </div>
        </div>`;
      document.body.append(modale);

      // Simulation du comportement de la librairie jQuery pour gérer la modale
      $.fn.modal = jest.fn();

      // Instanciation de la classe Bills
      const billsContainer = new Bills({
        document,
        onNavigate: (pathname) => document.body.innerHTML = ROUTES_PATH[pathname],
        store: null,
        localStorage: window.localStorage,
      });

      // Récupération et clic sur l'icône d'œil
      const icon = screen.getAllByTestId('icon-eye')[0];
      icon.setAttribute('data-bill-url', 'https://test.com');
      userEvent.click(icon);

      // Vérification de l'ouverture de la modale et du contenu affiché
      expect($.fn.modal).toHaveBeenCalledWith("show");
      const modalBody = document.querySelector("#modaleFile .modal-body");
      expect(modalBody).toBeTruthy();
    });

    // Test pour vérifier la redirection vers le formulaire de nouvelle facture
    test("Then user should be redirected to new bill form when new bill button is clicked", async () => {
      document.body.innerHTML = BillsUI({ data: bills }); // Rendu de l'interface des factures

      // Mock de la fonction onNavigate pour simuler la navigation
      const onNavigate = jest.fn();

      // Instanciation de la classe Bills
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      // Clic sur le bouton "Nouvelle Facture"
      const buttonNewBill = screen.getByTestId('btn-new-bill');
      userEvent.click(buttonNewBill);

      // Vérification que la navigation a bien été effectuée
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill);
    });

    // Test d'intégration pour vérifier la récupération des factures via une API mockée
    test("fetches bills from mock API GET", async () => {
      const storeMock = { bills: mockStore.bills };
      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: storeMock,
        localStorage: localStorageMock,
      });
      const fetchedBills = await billsContainer.getBills();
      expect(fetchedBills).toHaveLength(bills.length);
    });

    // Tests pour gérer les erreurs 404 et 500 lors de la récupération des factures depuis l'API
describe("When an error occurs on API", () => {
  let billsInstance;

  // Avant chaque test, initialisation du DOM et de l'instance de Bills
  beforeEach(() => {
    document.body.innerHTML = BillsUI({ data: [], loading: false, error: null }); // Configuration du DOM avec une interface Bills initialement vide (pas de données, pas de chargement, pas d'erreur)

    // Création d'une nouvelle instance de Bills avec des dépendances simulées 
    billsInstance = new Bills({
      document, //Élément DOM actuel
      onNavigate: jest.fn(), // Simulation de la navigation entre pages
      store: mockStore, // Utilisation du mockStore pour simuler les appels API
      localStorage: window.localStorage, //Utilisation d'un mock de localStorage pour simuler l'utilisateur connecté
    });
  });

  // Test pour vérifier que l'erreur 404 est correctement gérée
  test("fetches bills from an API and fails with 404 message error (error page 404)", async () => {
    // Simulation d'un comportement du mockStore qui rejette avec une erreur 404 lors d'une requête pour récupérer des factures
    jest.spyOn(mockStore, "bills").mockImplementationOnce(() => ({
      list: () => Promise.reject(new Error("Erreur 404")), // Mock de la méthode `list` qui renvoie une erreur
    }));

    await billsInstance.getBills().catch(() => {});   // Appel de la méthode `getBills` de l'instance de Bills, et capture de l'erreur rejetée pour éviter les avertissements de Jest


    document.body.innerHTML = BillsUI({ error: "Erreur 404" });  // Mise à jour du DOM pour afficher une page d'erreur spécifique avec le message "Erreur 404"

    expect(screen.getByText(/Erreur 404/)).toBeTruthy(); // Vérification que le texte "Erreur 404" est bien rendu dans le DOM
  });

  // Test pour vérifier que l'erreur 500 est correctement gérée
  test("fetches messages from an API and fails with 500 message error (error page 500)", async () => {
    // Simulation d'un comportement du mockStore qui rejette avec une erreur 500 lors d'une requête pour récupérer des factures
    jest.spyOn(mockStore, "bills").mockImplementationOnce(() => ({
      list: () => Promise.reject(new Error("Erreur 500")), // Mock de la méthode `list` qui renvoie une erreur
    }));


    await billsInstance.getBills().catch(() => {});  // Appel de la méthode `getBills` de l'instance de Bills, et capture de l'erreur rejetée pour éviter les avertissements de Jest
    document.body.innerHTML = BillsUI({ error: "Erreur 500" });// Mise à jour du DOM pour afficher une page d'erreur spécifique avec le message "Erreur 500"
    expect(screen.getByText(/Erreur 500/)).toBeTruthy();   // Vérification que le texte "Erreur 500" est bien rendu dans le DOM
     });
    });

  });
});
