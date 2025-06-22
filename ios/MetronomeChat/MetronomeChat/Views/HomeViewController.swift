import UIKit
import Combine

class HomeViewController: UIViewController {
    // MARK: - Properties
    private let viewModel: HomeViewModelProtocol
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - UI Components
    private let gradientBackgroundView = GradientBackgroundView()
    private let hamburgerButton = UIButton(type: .system)
    private let profileButton = UIButton(type: .system)
    private let modelSelectorButton = ModelSelectorButton()
    private let greetingLabel = UILabel()
    private let nameLabel = UILabel()
    private let logoImageView = UIImageView()
    private let suggestionsStackView = UIStackView()
    private let messageInputView = MessageInputView()
    
    // Constraints
    private var messageInputBottomConstraint: NSLayoutConstraint!
    
    // MARK: - Initialization
    init(viewModel: HomeViewModelProtocol = HomeViewModel()) {
        self.viewModel = viewModel
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        self.viewModel = HomeViewModel()
        super.init(coder: coder)
    }
    
    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        bindViewModel()
        setupInitialData()
        setupKeyboardObservers()
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        NotificationCenter.default.removeObserver(self)
    }
    
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    // MARK: - Setup
    private func setupUI() {
        view.backgroundColor = .black
        
        // Add gradient background
        gradientBackgroundView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(gradientBackgroundView)
        
        // Setup navigation buttons
        setupNavigationButtons()
        
        // Setup model selector
        modelSelectorButton.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(modelSelectorButton)
        modelSelectorButton.addTarget(self, action: #selector(modelSelectorTapped), for: .touchUpInside)
        
        // Setup greeting labels
        setupGreetingLabels()
        
        // Setup logo
        setupLogo()
        
        // Setup suggestions
        setupSuggestions()
        
        // Setup message input
        messageInputView.delegate = self
        messageInputView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(messageInputView)
        
        // Layout constraints
        NSLayoutConstraint.activate([
            // Background
            gradientBackgroundView.topAnchor.constraint(equalTo: view.topAnchor),
            gradientBackgroundView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            gradientBackgroundView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            gradientBackgroundView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            // Hamburger button
            hamburgerButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            hamburgerButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            hamburgerButton.widthAnchor.constraint(equalToConstant: 40),
            hamburgerButton.heightAnchor.constraint(equalToConstant: 40),
            
            // Profile button
            profileButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            profileButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            profileButton.widthAnchor.constraint(equalToConstant: 40),
            profileButton.heightAnchor.constraint(equalToConstant: 40),
            
            // Model selector
            modelSelectorButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            modelSelectorButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            
            // Greeting label
            greetingLabel.topAnchor.constraint(equalTo: modelSelectorButton.bottomAnchor, constant: 48),
            greetingLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            greetingLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
            
            // Name label
            nameLabel.topAnchor.constraint(equalTo: greetingLabel.bottomAnchor, constant: 2),
            nameLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            nameLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
            
            // Logo
            logoImageView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            logoImageView.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -40),
            logoImageView.widthAnchor.constraint(equalToConstant: 140),
            logoImageView.heightAnchor.constraint(equalToConstant: 140),
            
            // Suggestions
            suggestionsStackView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            suggestionsStackView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            suggestionsStackView.bottomAnchor.constraint(equalTo: messageInputView.topAnchor, constant: -20),
            suggestionsStackView.heightAnchor.constraint(equalToConstant: 100),
            
            // Message input - extends to edges
            messageInputView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            messageInputView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        
        // Set up bottom constraint separately for keyboard handling
        messageInputBottomConstraint = messageInputView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        messageInputBottomConstraint.isActive = true
    }
    
    private func setupNavigationButtons() {
        // Hamburger button
        hamburgerButton.setImage(UIImage(systemName: "line.horizontal.3"), for: .normal)
        hamburgerButton.tintColor = .white
        hamburgerButton.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(hamburgerButton)
        hamburgerButton.addTarget(self, action: #selector(hamburgerTapped), for: .touchUpInside)
        
        // Profile button with image
        profileButton.translatesAutoresizingMaskIntoConstraints = false
        profileButton.layer.cornerRadius = 20
        profileButton.clipsToBounds = true
        profileButton.backgroundColor = UIColor(white: 1, alpha: 0.1)
        
        // Create a gradient placeholder for profile image
        let gradientColors = [
            UIColor(red: 255/255, green: 175/255, blue: 64/255, alpha: 1),
            UIColor(red: 255/255, green: 154/255, blue: 0/255, alpha: 1)
        ]
        profileButton.setImage(createGradientImage(colors: gradientColors, size: CGSize(width: 40, height: 40)), for: .normal)
        
        view.addSubview(profileButton)
        profileButton.addTarget(self, action: #selector(profileTapped), for: .touchUpInside)
    }
    
    private func createGradientImage(colors: [UIColor], size: CGSize) -> UIImage? {
        let gradientLayer = CAGradientLayer()
        gradientLayer.frame = CGRect(origin: .zero, size: size)
        gradientLayer.colors = colors.map { $0.cgColor }
        gradientLayer.startPoint = CGPoint(x: 0, y: 0)
        gradientLayer.endPoint = CGPoint(x: 1, y: 1)
        
        UIGraphicsBeginImageContextWithOptions(size, false, 0)
        guard let context = UIGraphicsGetCurrentContext() else { return nil }
        gradientLayer.render(in: context)
        let image = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        
        return image
    }
    
    private func setupGreetingLabels() {
        // Greeting label
        greetingLabel.font = .systemFont(ofSize: 36, weight: .semibold)
        greetingLabel.textColor = .white
        greetingLabel.textAlignment = .left
        greetingLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(greetingLabel)
        
        // Name label
        nameLabel.font = .systemFont(ofSize: 36, weight: .semibold)
        nameLabel.textColor = .white
        nameLabel.textAlignment = .left
        nameLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(nameLabel)
    }
    
    private func setupLogo() {
        // Logo with gradient overlay
        let logoConfig = UIImage.SymbolConfiguration(pointSize: 100, weight: .thin)
        logoImageView.image = UIImage(systemName: "sparkle", withConfiguration: logoConfig)
        logoImageView.tintColor = .white.withAlphaComponent(0.08)
        logoImageView.contentMode = .scaleAspectFit
        logoImageView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(logoImageView)
    }
    
    private func setupSuggestions() {
        suggestionsStackView.axis = .horizontal
        suggestionsStackView.distribution = .fillEqually
        suggestionsStackView.spacing = 10
        suggestionsStackView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(suggestionsStackView)
        
        // Add suggestion cards
        for (index, suggestion) in viewModel.suggestions.enumerated() {
            let card = SuggestionCardView()
            card.icon = UIImage(systemName: suggestion.icon)
            card.title = suggestion.title
            card.subtitle = suggestion.subtitle
            card.tapHandler = { [weak self] in
                self?.handleSuggestionTap(at: index)
            }
            suggestionsStackView.addArrangedSubview(card)
        }
    }
    
    private func setupInitialData() {
        greetingLabel.text = "\(viewModel.greeting),"
        nameLabel.text = viewModel.userName
    }
    
    // MARK: - Binding
    private func bindViewModel() {
        viewModel.selectedModel
            .receive(on: DispatchQueue.main)
            .sink { [weak self] model in
                self?.modelSelectorButton.currentModel = model
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Actions
    @objc private func hamburgerTapped() {
        // TODO: Show side menu
    }
    
    @objc private func profileTapped() {
        // TODO: Show profile
    }
    
    @objc private func modelSelectorTapped() {
        showModelSelector()
    }
    
    private func handleSuggestionTap(at index: Int) {
        let suggestions = [
            "List 5 healthy breakfast ideas that are quick to prepare",
            "What should I do in Tokyo for a 3-day trip?",
            "Translate 'Hello, how are you today?' to Spanish"
        ]
        
        guard index < suggestions.count else { return }
        let message = suggestions[index]
        
        // Navigate to chat with pre-filled message
        navigateToChat(with: message)
    }
    
    // MARK: - Navigation
    private func showModelSelector() {
        let modelSelectorVC = ModelSelectorViewController(viewModel: viewModel)
        let navController = UINavigationController(rootViewController: modelSelectorVC)
        navController.modalPresentationStyle = .pageSheet
        
        if let sheet = navController.sheetPresentationController {
            sheet.detents = [.medium(), .large()]
            sheet.prefersGrabberVisible = true
            sheet.preferredCornerRadius = 24
        }
        
        present(navController, animated: true)
    }
    
    private func navigateToChat(with message: String? = nil) {
        // TODO: Navigate to chat view controller
        print("Navigate to chat with message: \(message ?? "New chat")")
    }
    
    // MARK: - Keyboard Handling
    private func setupKeyboardObservers() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(keyboardWillShow),
            name: UIResponder.keyboardWillShowNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(keyboardWillHide),
            name: UIResponder.keyboardWillHideNotification,
            object: nil
        )
    }
    
    @objc private func keyboardWillShow(notification: NSNotification) {
        guard let userInfo = notification.userInfo,
              let keyboardFrame = userInfo[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect,
              let duration = userInfo[UIResponder.keyboardAnimationDurationUserInfoKey] as? TimeInterval else {
            return
        }
        
        let keyboardHeight = keyboardFrame.height
        
        messageInputBottomConstraint.constant = -keyboardHeight
        
        UIView.animate(withDuration: duration) {
            self.view.layoutIfNeeded()
        }
    }
    
    @objc private func keyboardWillHide(notification: NSNotification) {
        guard let userInfo = notification.userInfo,
              let duration = userInfo[UIResponder.keyboardAnimationDurationUserInfoKey] as? TimeInterval else {
            return
        }
        
        messageInputBottomConstraint.constant = 0
        
        UIView.animate(withDuration: duration) {
            self.view.layoutIfNeeded()
        }
    }
}

// MARK: - MessageInputViewDelegate
extension HomeViewController: MessageInputViewDelegate {
    func messageInputView(_ view: MessageInputView, didSendMessage message: String) {
        navigateToChat(with: message)
    }
    
    func messageInputViewDidTapAttachment(_ view: MessageInputView) {
        // TODO: Show attachment options
    }
    
    func messageInputViewDidTapSearch(_ view: MessageInputView) {
        // TODO: Enable web search
    }
    
    func messageInputViewDidTapReason(_ view: MessageInputView) {
        // TODO: Enable reasoning mode
    }
    
    func messageInputViewDidTapVoice(_ view: MessageInputView) {
        // TODO: Start voice input
    }
}