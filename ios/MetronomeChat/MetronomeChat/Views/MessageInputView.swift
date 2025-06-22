import UIKit

protocol MessageInputViewDelegate: AnyObject {
    func messageInputView(_ view: MessageInputView, didSendMessage message: String)
    func messageInputViewDidTapAttachment(_ view: MessageInputView)
    func messageInputViewDidTapSearch(_ view: MessageInputView)
    func messageInputViewDidTapReason(_ view: MessageInputView)
    func messageInputViewDidTapVoice(_ view: MessageInputView)
}

class MessageInputView: UIView {
    weak var delegate: MessageInputViewDelegate?

    private let containerView = GlassmorphicView()
    private let gradientLayer = CAGradientLayer()
    private let textView = UITextView()
    private let placeholderLabel = UILabel()
    private let attachmentButton = UIButton(type: .system)
    private let searchButton = UIButton(type: .system)
    private let reasonButton = UIButton(type: .system)
    private let voiceButton = UIButton(type: .system)
    private let buttonStackView = UIStackView()

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    private func setupView() {
        // Container setup with rounded top corners only
        containerView.layer.cornerRadius = 24
        containerView.layer.maskedCorners = [.layerMinXMinYCorner, .layerMaxXMinYCorner]
        containerView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(containerView)
        
        // Add gradient overlay for frosted glass effect
        gradientLayer.colors = [
            UIColor(red: 255/255, green: 140/255, blue: 200/255, alpha: 0.08).cgColor,
            UIColor(red: 180/255, green: 80/255, blue: 150/255, alpha: 0.05).cgColor,
            UIColor.clear.cgColor
        ]
        gradientLayer.locations = [0, 0.3, 1]
        gradientLayer.startPoint = CGPoint(x: 0.5, y: 1)
        gradientLayer.endPoint = CGPoint(x: 0.5, y: 0)
        containerView.layer.addSublayer(gradientLayer)

        // Text view setup
        textView.backgroundColor = .clear
        textView.font = .systemFont(ofSize: 17)
        textView.textColor = .white
        textView.tintColor = .white
        textView.keyboardAppearance = .dark
        textView.returnKeyType = .send
        textView.textContainerInset = UIEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)
        textView.isScrollEnabled = false
        textView.delegate = self
        textView.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(textView)

        // Placeholder
        placeholderLabel.text = "Message Metronome Chat"
        placeholderLabel.font = .systemFont(ofSize: 17)
        placeholderLabel.textColor = .white.withAlphaComponent(0.4)
        placeholderLabel.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(placeholderLabel)

        // Button stack view
        buttonStackView.axis = .horizontal
        buttonStackView.spacing = 12
        buttonStackView.distribution = .fillProportionally
        buttonStackView.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(buttonStackView)

        // Configure buttons
        setupButton(attachmentButton, imageName: "plus", action: #selector(attachmentTapped))
        setupButton(
            searchButton, imageName: "globe", title: "Search", action: #selector(searchTapped))
        setupButton(
            reasonButton, imageName: "brain", title: "Reason", action: #selector(reasonTapped))
        setupButton(voiceButton, imageName: "mic.fill", action: #selector(voiceTapped))

        // Add buttons to stack
        [attachmentButton, searchButton, reasonButton, voiceButton].forEach {
            buttonStackView.addArrangedSubview($0)
        }

        NSLayoutConstraint.activate([
            // Container - extends to edges
            containerView.topAnchor.constraint(equalTo: topAnchor),
            containerView.leadingAnchor.constraint(equalTo: leadingAnchor),
            containerView.trailingAnchor.constraint(equalTo: trailingAnchor),
            containerView.bottomAnchor.constraint(equalTo: bottomAnchor),

            // Text view
            textView.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 24),
            textView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 16),
            textView.trailingAnchor.constraint(
                equalTo: containerView.trailingAnchor, constant: -16),
            textView.heightAnchor.constraint(greaterThanOrEqualToConstant: 56),

            // Placeholder
            placeholderLabel.centerYAnchor.constraint(equalTo: textView.centerYAnchor),
            placeholderLabel.leadingAnchor.constraint(
                equalTo: textView.leadingAnchor, constant: 20),

            // Button stack
            buttonStackView.topAnchor.constraint(equalTo: textView.bottomAnchor, constant: 16),
            buttonStackView.leadingAnchor.constraint(
                equalTo: containerView.leadingAnchor, constant: 24),
            buttonStackView.trailingAnchor.constraint(
                equalTo: containerView.trailingAnchor, constant: -24),
            buttonStackView.bottomAnchor.constraint(
                equalTo: containerView.safeAreaLayoutGuide.bottomAnchor, constant: -24),
            buttonStackView.heightAnchor.constraint(equalToConstant: 44),
        ])

        // Special width constraint for attachment button
        attachmentButton.widthAnchor.constraint(equalToConstant: 44).isActive = true
        voiceButton.widthAnchor.constraint(equalToConstant: 44).isActive = true
    }

    private func setupButton(
        _ button: UIButton, imageName: String, title: String? = nil, action: Selector
    ) {
        button.tintColor = .white

        if let title = title {
            button.backgroundColor = UIColor(white: 1, alpha: 0.1)
            button.layer.cornerRadius = 22

            var config = UIButton.Configuration.plain()
            config.image = UIImage(systemName: imageName)?.withConfiguration(
                UIImage.SymbolConfiguration(pointSize: 14))
            config.title = title
            config.imagePlacement = .leading
            config.imagePadding = 4
            config.contentInsets = NSDirectionalEdgeInsets(
                top: 0, leading: 12, bottom: 0, trailing: 12)
            config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer {
                incoming in
                var outgoing = incoming
                outgoing.font = UIFont.systemFont(ofSize: 10.5, weight: .medium)
                return outgoing
            }

            button.configuration = config
            button.tintColor = .white
        } else {
            // Circle button style for attachment and voice
            if imageName == "mic.fill" {
                // Microphone has solid dark background
                button.backgroundColor = UIColor(white: 0.15, alpha: 0.8)
                button.layer.cornerRadius = 22
                button.layer.borderWidth = 0
            } else {
                // Plus button has border only
                button.backgroundColor = .clear
                button.layer.cornerRadius = 22
                button.layer.borderWidth = 1.5
                button.layer.borderColor = UIColor.white.withAlphaComponent(0.3).cgColor
            }
            button.setImage(
                UIImage(systemName: imageName)?.withConfiguration(
                    UIImage.SymbolConfiguration(pointSize: 20)), for: .normal)
        }

        button.addTarget(self, action: action, for: .touchUpInside)

        // Add hover effect
        button.addTarget(self, action: #selector(buttonTouchDown(_:)), for: .touchDown)
        button.addTarget(
            self, action: #selector(buttonTouchUp(_:)),
            for: [.touchUpInside, .touchUpOutside, .touchCancel])
    }

    @objc private func buttonTouchDown(_ sender: UIButton) {
        UIView.animate(withDuration: 0.1) {
            sender.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
            sender.alpha = 0.8
        }
    }

    @objc private func buttonTouchUp(_ sender: UIButton) {
        UIView.animate(withDuration: 0.1) {
            sender.transform = .identity
            sender.alpha = 1.0
        }
    }

    @objc private func attachmentTapped() {
        delegate?.messageInputViewDidTapAttachment(self)
    }

    @objc private func searchTapped() {
        delegate?.messageInputViewDidTapSearch(self)
    }

    @objc private func reasonTapped() {
        delegate?.messageInputViewDidTapReason(self)
    }

    @objc private func voiceTapped() {
        delegate?.messageInputViewDidTapVoice(self)
    }

    func clearInput() {
        textView.text = ""
        textViewDidChange(textView)
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        gradientLayer.frame = containerView.bounds
        gradientLayer.cornerRadius = containerView.layer.cornerRadius
        gradientLayer.maskedCorners = containerView.layer.maskedCorners
    }
}

// MARK: - UITextViewDelegate
extension MessageInputView: UITextViewDelegate {
    func textViewDidChange(_ textView: UITextView) {
        placeholderLabel.isHidden = !textView.text.isEmpty

        // Adjust height
        let size = textView.sizeThatFits(
            CGSize(width: textView.frame.width, height: CGFloat.greatestFiniteMagnitude))
        textView.isScrollEnabled = size.height > 120

        if !textView.isScrollEnabled {
            invalidateIntrinsicContentSize()
        }
    }

    func textView(
        _ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String
    ) -> Bool {
        if text == "\n" {
            // Send message on return
            if !textView.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                delegate?.messageInputView(self, didSendMessage: textView.text)
                clearInput()
            }
            return false
        }
        return true
    }
}

