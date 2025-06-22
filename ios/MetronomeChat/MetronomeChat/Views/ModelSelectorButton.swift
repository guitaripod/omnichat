import UIKit

class ModelSelectorButton: UIButton {
    private let sparkleImageView = UIImageView()
    private let modelLabel = UILabel()
    private let chevronImageView = UIImageView()
    private let containerView = GlassmorphicView()
    
    var currentModel: AIModel? {
        didSet {
            updateModelDisplay()
        }
    }
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }
    
    private func setupView() {
        // Glassmorphic container with rounded rectangle
        containerView.customCornerRadius = 12
        containerView.isUserInteractionEnabled = false
        containerView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(containerView)
        
        // Sparkle icon
        sparkleImageView.image = UIImage(systemName: "sparkle")
        sparkleImageView.tintColor = UIColor(red: 255/255, green: 120/255, blue: 200/255, alpha: 1)
        sparkleImageView.contentMode = .scaleAspectFit
        sparkleImageView.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(sparkleImageView)
        
        // Model label
        modelLabel.font = .systemFont(ofSize: 16, weight: .medium)
        modelLabel.textColor = .white.withAlphaComponent(0.9)
        modelLabel.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(modelLabel)
        
        // Chevron
        chevronImageView.image = UIImage(systemName: "chevron.down")
        chevronImageView.tintColor = .white.withAlphaComponent(0.7)
        chevronImageView.contentMode = .scaleAspectFit
        chevronImageView.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(chevronImageView)
        
        NSLayoutConstraint.activate([
            // Container
            containerView.topAnchor.constraint(equalTo: topAnchor),
            containerView.leadingAnchor.constraint(equalTo: leadingAnchor),
            containerView.trailingAnchor.constraint(equalTo: trailingAnchor),
            containerView.bottomAnchor.constraint(equalTo: bottomAnchor),
            containerView.heightAnchor.constraint(equalToConstant: 40),
            
            // Sparkle
            sparkleImageView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 12),
            sparkleImageView.centerYAnchor.constraint(equalTo: containerView.centerYAnchor),
            sparkleImageView.widthAnchor.constraint(equalToConstant: 18),
            sparkleImageView.heightAnchor.constraint(equalToConstant: 18),
            
            // Label
            modelLabel.leadingAnchor.constraint(equalTo: sparkleImageView.trailingAnchor, constant: 8),
            modelLabel.centerYAnchor.constraint(equalTo: containerView.centerYAnchor),
            
            // Chevron
            chevronImageView.leadingAnchor.constraint(equalTo: modelLabel.trailingAnchor, constant: 8),
            chevronImageView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -12),
            chevronImageView.centerYAnchor.constraint(equalTo: containerView.centerYAnchor),
            chevronImageView.widthAnchor.constraint(equalToConstant: 14),
            chevronImageView.heightAnchor.constraint(equalToConstant: 14)
        ])
        
        // Add press animation
        addTarget(self, action: #selector(touchDown), for: .touchDown)
        addTarget(self, action: #selector(touchUp), for: [.touchUpInside, .touchUpOutside, .touchCancel])
    }
    
    private func updateModelDisplay() {
        guard let model = currentModel else {
            modelLabel.text = "Select Model"
            return
        }
        
        modelLabel.text = "\(model.name)"
        
        // Update sparkle icon based on provider
        sparkleImageView.image = UIImage(systemName: model.provider.iconName)
    }
    
    @objc private func touchDown() {
        UIView.animate(withDuration: 0.1) {
            self.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
            self.alpha = 0.8
        }
    }
    
    @objc private func touchUp() {
        UIView.animate(withDuration: 0.1) {
            self.transform = .identity
            self.alpha = 1.0
        }
    }
}