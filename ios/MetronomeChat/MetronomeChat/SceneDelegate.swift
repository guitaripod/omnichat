import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

  var window: UIWindow?

  func scene(
    _ scene: UIScene, willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard (scene as? UIWindowScene) != nil else { return }
    guard let windowScene = scene as? UIWindowScene else { return }
    
    // Login test user for development
    AuthService.shared.loginAsTestUser()
    
    window = UIWindow(windowScene: windowScene)
    let homeViewController = HomeViewController()
    window?.rootViewController = homeViewController
    window?.makeKeyAndVisible()
  }
}
