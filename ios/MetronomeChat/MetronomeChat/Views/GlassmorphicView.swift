import UIKit

class GlassmorphicView: UIView {
    private let blurEffectView: UIVisualEffectView
    private let vibrancyEffectView: UIVisualEffectView
    
    var customCornerRadius: CGFloat = 20 {
        didSet {
            layer.cornerRadius = customCornerRadius
            blurEffectView.layer.cornerRadius = customCornerRadius
        }
    }
    
    override init(frame: CGRect) {
        let blurEffect = UIBlurEffect(style: .systemUltraThinMaterialDark)
        blurEffectView = UIVisualEffectView(effect: blurEffect)
        
        let vibrancyEffect = UIVibrancyEffect(blurEffect: blurEffect)
        vibrancyEffectView = UIVisualEffectView(effect: vibrancyEffect)
        
        super.init(frame: frame)
        setupView()
    }
    
    required init?(coder: NSCoder) {
        let blurEffect = UIBlurEffect(style: .systemUltraThinMaterialDark)
        blurEffectView = UIVisualEffectView(effect: blurEffect)
        
        let vibrancyEffect = UIVibrancyEffect(blurEffect: blurEffect)
        vibrancyEffectView = UIVisualEffectView(effect: vibrancyEffect)
        
        super.init(coder: coder)
        setupView()
    }
    
    private func setupView() {
        backgroundColor = UIColor(white: 0.1, alpha: 0.3)
        layer.cornerRadius = 20
        layer.masksToBounds = true
        
        // Add subtle border
        layer.borderWidth = 0.5
        layer.borderColor = UIColor(white: 1, alpha: 0.1).cgColor
        
        // Add blur effect
        blurEffectView.translatesAutoresizingMaskIntoConstraints = false
        blurEffectView.alpha = 0.7
        addSubview(blurEffectView)
        
        NSLayoutConstraint.activate([
            blurEffectView.topAnchor.constraint(equalTo: topAnchor),
            blurEffectView.leadingAnchor.constraint(equalTo: leadingAnchor),
            blurEffectView.trailingAnchor.constraint(equalTo: trailingAnchor),
            blurEffectView.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        blurEffectView.layer.cornerRadius = layer.cornerRadius
    }
}