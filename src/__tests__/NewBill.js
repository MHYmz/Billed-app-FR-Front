/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom" 
import userEvent from "@testing-library/user-event" // Librairie permettant de simuler des interactions utilisateur dans les tests.
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store" // Mock de la couche de stockage pour isoler les tests des dépendances externes.
import { localStorageMock } from "../__mocks__/localStorage.js"; //  Mock de localStorage pour simuler son comportement dans un environnement de test.
import { ROUTES } from "../constants/routes" // Fichier centralisant les routes de l'application.

jest.mock("../app/store", () => mockStore) // Remplace les imports de store par une version mockée pour les tests.


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then file upload with correct type sucessfully", () => { 
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion


      
      // Définit une fonction pour naviguer vers une nouvelle route en mettant à jour le contenu de la page
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      // Configure `localStorage` mocké avec des données utilisateur fictives
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
      }))

      // Initialise un contrôleur pour la page NewBill
      const newBillController = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

      // Simule l'interaction utilisateur pour le téléchargement d'un fichier valide
      const fileInput = screen.getByTestId("file");
      const file = new File(['fake_photo_path'], 'fake_photo_path.png', { type: 'image/png' })
      const handleChange = jest.fn(newBillController.handleChangeFile);
      fileInput.addEventListener('change', handleChange)
      userEvent.upload(fileInput, file)
      expect(handleChange).toHaveBeenCalled()
    })

    // Test pour le téléchargement d'un fichier avec un type incorrect
    test("Then file upload with incorrect type", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion

       // Définit une fonction pour naviguer (réutilisation)
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

       // Mocke `localStorage` pour un utilisateur employé
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
      }))

      // Initialise le contrôleur
      const newBillController = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

       // Simule un téléchargement de fichier incorrect (PDF au lieu de PNG)
      const fileInput = screen.getByTestId("file");
      const file = new File(['fake_photo_path'], 'fake_photo_path.pdf', { type: 'application/pdf' })

      const handleChange = jest.fn(newBillController.handleChangeFile);
      fileInput.addEventListener('change', handleChange)
      userEvent.upload(fileInput, file)
    })


    // Test pour un téléchargement échoué avec une erreur serveur
    test("Then file upload with error", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      jest.spyOn(mockStore, "bills") // Espionne la méthode bills du mock
      
      //to-do write assertion

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
      }))

      mockStore.bills.mockImplementationOnce(() => {
        return { create : () =>  Promise.reject(new Error("Erreur 500")) }})

      const newBillController = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

      const fileInput = screen.getByTestId("file");
      const file = new File(['fake_photo_path'], 'fake_photo_path.png', { type: 'image/png' })

      const handleChange = jest.fn(newBillController.handleChangeFile);
      
      fileInput.addEventListener('change', handleChange)
      userEvent.upload(fileInput, file)
    })
  })
})

// Tests pour un utilisateur admin
describe("Given I am connected as an admin", () => {
  describe("When I am on NewBill Page", () => {
    test("Then file upload with correct type sucessfully", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Admin',
      }))

      const newBillController = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

      // Simule la saisie d'informations dans des champs de formulaire

      const expenseTypeInput = screen.getByTestId("expense-type");
      fireEvent.change(expenseTypeInput, { target: { value: "pasunemail" } });

      const datepickerInput = screen.getByTestId("datepicker");
      fireEvent.change(datepickerInput, { target: { value: "pasunemail" } });

      const amountInput = screen.getByTestId("amount");
      fireEvent.change(amountInput, { target: { value: "pasunemail" } });

      const pctInput = screen.getByTestId("pct");
      fireEvent.change(pctInput, { target: { value: "pasunemail" } });

      const fileInput = screen.getByTestId("file");
      const file = new File(['fake_photo_path'], 'fake_photo_path.png', { type: 'image/png' })
      userEvent.upload(fileInput, file)

      // Simule la soumission du formulaire
      const handleSubmit = jest.fn(newBillController.handleSubmit);

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled() // Vérifie que la soumission a bien été appelée
    })
  })
})