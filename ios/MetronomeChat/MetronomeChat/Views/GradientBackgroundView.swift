import UIKit

class GradientBackgroundView: UIView {
    private let gradientLayer = CAGradientLayer()
    private let glowLayer = CAGradientLayer()
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupGradient()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupGradient()
    }
    
    private func setupGradient() {
        // Main gradient - dark background with subtle purple
        gradientLayer.colors = [
            UIColor(red: 25/255, green: 15/255, blue: 35/255, alpha: 1).cgColor,    // Dark purple top
            UIColor(red: 20/255, green: 12/255, blue: 28/255, alpha: 1).cgColor,     // Darker middle
            UIColor(red: 15/255, green: 10/255, blue: 22/255, alpha: 1).cgColor      // Very dark bottom
        ]
        
        gradientLayer.locations = [0, 0.6, 1]
        gradientLayer.startPoint = CGPoint(x: 0.5, y: 0)
        gradientLayer.endPoint = CGPoint(x: 0.5, y: 1)
        
        // Add glow layer emanating from bottom (chatbox glow) - pink/purple
        glowLayer.type = .radial
        glowLayer.colors = [
            UIColor(red: 180/255, green: 80/255, blue: 150/255, alpha: 0.5).cgColor,    // Pink-purple center
            UIColor(red: 140/255, green: 60/255, blue: 120/255, alpha: 0.35).cgColor,   // Mid pink
            UIColor(red: 100/255, green: 40/255, blue: 80/255, alpha: 0.2).cgColor,     // Outer fade
            UIColor(red: 60/255, green: 20/255, blue: 50/255, alpha: 0.1).cgColor,      // Very faint
            UIColor.clear.cgColor                                                         // Transparent edge
        ]
        glowLayer.locations = [0, 0.15, 0.3, 0.6, 1]
        glowLayer.startPoint = CGPoint(x: 0.5, y: 0.5)
        glowLayer.endPoint = CGPoint(x: 1, y: 1)
        
        layer.insertSublayer(gradientLayer, at: 0)
        layer.insertSublayer(glowLayer, at: 1)
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        gradientLayer.frame = bounds
        
        // Position glow at bottom center to emanate from chatbox
        let glowSize = max(bounds.width, bounds.height) * 1.8
        glowLayer.frame = CGRect(
            x: (bounds.width - glowSize) / 2,
            y: bounds.height - glowSize * 0.45,
            width: glowSize,
            height: glowSize
        )
    }
}