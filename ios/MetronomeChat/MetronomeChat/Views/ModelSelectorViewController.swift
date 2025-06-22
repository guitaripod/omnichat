import UIKit
import Combine

class ModelSelectorViewController: UIViewController {
    // MARK: - Properties
    private let viewModel: HomeViewModelProtocol
    private let tableView = UITableView(frame: .zero, style: .insetGrouped)
    private let searchController = UISearchController(searchResultsController: nil)
    private var filteredModels: [AIModel] = []
    private var groupedModels: [AIProvider: [AIModel]] = [:]
    
    // MARK: - Initialization
    init(viewModel: HomeViewModelProtocol) {
        self.viewModel = viewModel
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupData()
    }
    
    // MARK: - Setup
    private func setupUI() {
        title = "Select Model"
        view.backgroundColor = .systemBackground
        
        // Navigation items
        navigationItem.leftBarButtonItem = UIBarButtonItem(
            barButtonSystemItem: .cancel,
            target: self,
            action: #selector(cancelTapped)
        )
        
        // Search controller
        searchController.searchResultsUpdater = self
        searchController.obscuresBackgroundDuringPresentation = false
        searchController.searchBar.placeholder = "Search models"
        navigationItem.searchController = searchController
        definesPresentationContext = true
        
        // Table view
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(ModelTableViewCell.self, forCellReuseIdentifier: "ModelCell")
        tableView.backgroundColor = .clear
        tableView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(tableView)
        
        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }
    
    private func setupData() {
        // Group models by provider
        for model in viewModel.availableModels {
            if groupedModels[model.provider] == nil {
                groupedModels[model.provider] = []
            }
            groupedModels[model.provider]?.append(model)
        }
        
        filteredModels = viewModel.availableModels
    }
    
    // MARK: - Actions
    @objc private func cancelTapped() {
        dismiss(animated: true)
    }
    
    // MARK: - Helpers
    private func filterModels(with searchText: String) {
        if searchText.isEmpty {
            filteredModels = viewModel.availableModels
        } else {
            filteredModels = viewModel.availableModels.filter { model in
                model.name.localizedCaseInsensitiveContains(searchText) ||
                model.provider.rawValue.localizedCaseInsensitiveContains(searchText) ||
                (model.description ?? "").localizedCaseInsensitiveContains(searchText)
            }
        }
        
        // Regroup filtered models
        groupedModels = [:]
        for model in filteredModels {
            if groupedModels[model.provider] == nil {
                groupedModels[model.provider] = []
            }
            groupedModels[model.provider]?.append(model)
        }
        
        tableView.reloadData()
    }
}

// MARK: - UITableViewDataSource
extension ModelSelectorViewController: UITableViewDataSource {
    func numberOfSections(in tableView: UITableView) -> Int {
        return AIProvider.allCases.count
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        let provider = AIProvider.allCases[section]
        return groupedModels[provider]?.count ?? 0
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "ModelCell", for: indexPath) as! ModelTableViewCell
        
        let provider = AIProvider.allCases[indexPath.section]
        if let models = groupedModels[provider] {
            let model = models[indexPath.row]
            cell.configure(with: model, isSelected: model.id == viewModel.selectedModel.value?.id)
        }
        
        return cell
    }
    
    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        let provider = AIProvider.allCases[section]
        return groupedModels[provider]?.isEmpty == false ? provider.rawValue : nil
    }
}

// MARK: - UITableViewDelegate
extension ModelSelectorViewController: UITableViewDelegate {
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        
        let provider = AIProvider.allCases[indexPath.section]
        if let models = groupedModels[provider] {
            let model = models[indexPath.row]
            viewModel.selectModel(model)
            dismiss(animated: true)
        }
    }
}

// MARK: - UISearchResultsUpdating
extension ModelSelectorViewController: UISearchResultsUpdating {
    func updateSearchResults(for searchController: UISearchController) {
        filterModels(with: searchController.searchBar.text ?? "")
    }
}

// MARK: - Model Table View Cell
class ModelTableViewCell: UITableViewCell {
    private let iconImageView = UIImageView()
    private let nameLabel = UILabel()
    private let descriptionLabel = UILabel()
    private let checkmarkImageView = UIImageView()
    private let badgeStackView = UIStackView()
    
    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupUI()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupUI()
    }
    
    private func setupUI() {
        // Icon
        iconImageView.contentMode = .scaleAspectFit
        iconImageView.tintColor = .label
        iconImageView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(iconImageView)
        
        // Name label
        nameLabel.font = .systemFont(ofSize: 16, weight: .medium)
        nameLabel.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(nameLabel)
        
        // Description label
        descriptionLabel.font = .systemFont(ofSize: 14)
        descriptionLabel.textColor = .secondaryLabel
        descriptionLabel.numberOfLines = 2
        descriptionLabel.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(descriptionLabel)
        
        // Badge stack
        badgeStackView.axis = .horizontal
        badgeStackView.spacing = 4
        badgeStackView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(badgeStackView)
        
        // Checkmark
        checkmarkImageView.image = UIImage(systemName: "checkmark.circle.fill")
        checkmarkImageView.tintColor = .systemBlue
        checkmarkImageView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(checkmarkImageView)
        
        NSLayoutConstraint.activate([
            // Icon
            iconImageView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            iconImageView.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            iconImageView.widthAnchor.constraint(equalToConstant: 30),
            iconImageView.heightAnchor.constraint(equalToConstant: 30),
            
            // Name
            nameLabel.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 12),
            nameLabel.leadingAnchor.constraint(equalTo: iconImageView.trailingAnchor, constant: 12),
            
            // Badge stack
            badgeStackView.leadingAnchor.constraint(equalTo: nameLabel.trailingAnchor, constant: 8),
            badgeStackView.centerYAnchor.constraint(equalTo: nameLabel.centerYAnchor),
            badgeStackView.trailingAnchor.constraint(lessThanOrEqualTo: checkmarkImageView.leadingAnchor, constant: -8),
            
            // Description
            descriptionLabel.topAnchor.constraint(equalTo: nameLabel.bottomAnchor, constant: 4),
            descriptionLabel.leadingAnchor.constraint(equalTo: nameLabel.leadingAnchor),
            descriptionLabel.trailingAnchor.constraint(equalTo: checkmarkImageView.leadingAnchor, constant: -8),
            descriptionLabel.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -12),
            
            // Checkmark
            checkmarkImageView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            checkmarkImageView.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            checkmarkImageView.widthAnchor.constraint(equalToConstant: 24),
            checkmarkImageView.heightAnchor.constraint(equalToConstant: 24)
        ])
    }
    
    func configure(with model: AIModel, isSelected: Bool) {
        iconImageView.image = UIImage(systemName: model.provider.iconName)
        nameLabel.text = model.name
        descriptionLabel.text = model.description
        checkmarkImageView.isHidden = !isSelected
        
        // Clear previous badges
        badgeStackView.arrangedSubviews.forEach { $0.removeFromSuperview() }
        
        // Add feature badges
        if model.supportsImages {
            addBadge(text: "Vision", color: .systemBlue)
        }
        if model.supportsWebSearch {
            addBadge(text: "Web", color: .systemGreen)
        }
    }
    
    private func addBadge(text: String, color: UIColor) {
        let badge = UILabel()
        badge.text = text
        badge.font = .systemFont(ofSize: 11, weight: .medium)
        badge.textColor = color
        badge.backgroundColor = color.withAlphaComponent(0.15)
        badge.layer.cornerRadius = 4
        badge.layer.masksToBounds = true
        badge.textAlignment = .center
        
        let padding: CGFloat = 4
        badge.translatesAutoresizingMaskIntoConstraints = false
        badgeStackView.addArrangedSubview(badge)
        
        NSLayoutConstraint.activate([
            badge.heightAnchor.constraint(equalToConstant: 18),
            badge.widthAnchor.constraint(greaterThanOrEqualToConstant: 30)
        ])
        
        // Add padding
        badge.layoutMargins = UIEdgeInsets(top: padding, left: padding, bottom: padding, right: padding)
    }
}