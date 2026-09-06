안녕하세요. 스포카 제품팀 iOS 개발자 박건우입니다. 🙂

스포카 iOS 플랫폼에서는 Clean Swift 아키텍처를 기반으로 [키친보드](https://apps.apple.com/kr/app/%ED%82%A4%EC%B9%9C%EB%B3%B4%EB%93%9C-%EC%8B%9D%EC%9E%90%EC%9E%AC-%EC%9C%A0%ED%86%B5%EC%97%85%EC%B2%B4-%ED%95%84%EC%9A%94%ED%95%A0%EB%95%8C/id1565918209)와 [키친보드 유통사](https://apps.apple.com/kr/app/%ED%82%A4%EC%B9%9C%EB%B3%B4%EB%93%9C-%EC%9C%A0%ED%86%B5%EC%82%AC/id1630018371) iOS 앱을 개발하고 있습니다.

[Clean Swift](https://clean-swift.com)란, Uncle Bob의 클린 아키텍처를 iOS, MacOS 플랫폼에 맞게 적용한 형태의 아키텍처입니다.

![drawing](https://github.com/spoqa/CleanSwift-CIS/blob/main/Images/VIP.png?raw=true)

이 글에서는 스포카에서 Clean Swift 기반으로 iOS 앱을 개발하며 겪었던 어려움과 이를 어떻게 개선하였는지에 대한 내용을 다루어보겠습니다.

## 왜 Clean Swift를 채택하는가?

Clean Swift 아키텍처를 제품 개발에 꾸준히 사용한 이유는 아래와 같습니다.

1. 키친보드 iOS 앱의 아키텍처는 언제든지 바뀔 수 있다.
   * 스포카 모바일 챕터는 규모가 크지 않습니다. 그래서 추후 여러 사람과 공동으로 작업하게 되었을때 손쉽게 다른 아키텍처를 결합하거나, 현재의 아키텍처를 개선할 수 있어야한다고 보았습니다.
   * Clean Swift가 추구하는 프레임워크가 아닌 템플릿으로 만들어지는 아키텍처 구조는 특정 아키텍처에 강하게 결합되지 않도록 도와주었고 이는 개선에도 용이하였습니다.
2. 키친보드 iOS 앱은 로직의 복잡도가 높다.
   * 키친보드 서비스는 무거운 도메인들과 관리되어야하는 케이스가 다소 존재하는 편입니다. 저희는 이러한 로직의 복잡도가 UI의 복잡도보다 높다고 판단하였습니다.
   * 클린 아키텍처를 기반으로 한 Clean Swift는 iOS 플랫폼에 특화된 고수준과 저수준을 분리하는 방식을 제시합니다.
   * 이러한 고수준 비즈니스 논리의 분리가 키친보드 iOS 앱 코드의 복잡도를 낮출 수 있었습니다.

그러나 Clean Swift를 적용하며 마주한 문제가 있었습니다.

## 발전하는 iOS

저희가 마주한 Clean Swift의 문제점은 **발전하는 iOS** 문제였습니다.

iOS 플랫폼은 끊임없이 발전을 거듭했습니다. SwiftUI의 등장, 상태 관리의 중요성 대두, 새로운 비동기 처리 방식의 도입 등 Swift 언어와 패러다임은 다소 많은 변화를 거쳤습니다.

iOS 플랫폼의 클린 아키텍처라는 말이 무색하게 2015년에 발표된 Clean Swift는 2024년의 iOS 플랫폼에는 맞지 않게 된 것이었습니다.

![drawing](https://github.com/spoqa/CleanSwift-CIS/blob/main/Images/iOS-World-CleanSwift.png?raw=true)

이러한 Clean Swift의 문제점을 마주하여 새로운 기술 도입에 어려움을 겪었고, 새로운 아키텍처로의 변경을 생각하기도 했었습니다.

그러나 앞서 언급드린 프레임워크가 아닌 템플릿, 고수준과 저수준 분리 등 Clean Swift에서 제시하는 방향성은 여전히 유효하여 깊은 고민이 되었습니다.

## 더 나은 방법

Clean Swift를 만든 Raymond는 블로그에서 아래와 같은 말을 하였습니다.
> I am not perfect. No one is. It is very likely that there are **better ways** to do things, especially as the Swift language continues to evolve. I look forward to connect with you so we can learn and improve together. 저는 완벽하지 않습니다. 아무도 완벽하지 않죠. 특히 Swift 언어가 지속적으로 발전하는 만큼, **더 나은 방법**이 존재할 가능성이 큽니다. 여러분과 소통하며 서로 배우고 함께 성장하기를 기대합니다.

Raymond의 말처럼, 저희는 Swift 언어가 지속적으로 발전하는 만큼 더 나은 방법을 찾아 나아가야한다고 보았습니다. 그래서 Clean Swift를 변형하여 언어와 패러다임의 발전에 맞추는 여러 시도들을 해보았습니다.

이 글에서는 저희가 설계한 완벽하진 않지만 **더 나은 방법(better ways)**의 Clean Swift를 소개해 드려 보고자 합니다.

## 설계 목표

먼저 개선한 Clean Swift의 설계 목표로 기존의 장점들을 포함한 다음의 4가지를 선정하였습니다.

* **Single Responsibility (단일 책임)** : 컴포넌트를 세부적이고 명확하게 분리합니다. 세분화된 컴포넌트로 고수준과 저수준의 분리 또한 이루어지도록 합니다.
* **Testability (테스트 가능성)** : 컴포넌트간의 의존도를 낮추어 단위 테스팅 및 통합 테스팅을 쉽게 할 수 있도록 합니다.
* **Framework Agnostic (프레임워크 독립성)** : 외부 프레임워크에 종속된 아키텍처를 구성하지 않습니다. UI 혹은 Network Framework가 바뀌더라도, Swift 언어와 Foundation에서 제공하는 요소들만을 사용하여 구조화된 코드들은 영향을 받지 않습니다.
* **Manageability of State (상태 관리 용이성)** : 단방향, 부수효과 등 여러 상태 관리 기법들을 통해 애플리케이션의 상태를 예측 가능하게 만듭니다. 명확하게 관리되는 상태는 시스템, UI의 현재 상태를 빠르게 파악할 수 있게 해줍니다. SwiftUI를 비롯한 다양한 신기술과 패러다임에서 중심이 되는 개념입니다.

이제 4가지 목표들을 달성하기 위해 개선한 Clean Swift를 알아보겠습니다.

## CIS (Controller-Interactor-Store)

![drawing](https://github.com/spoqa/CleanSwift-CIS/blob/main/Images/Main-Diagram.png?raw=true)

상태 관리 개념과 클린아키텍처 논리를 중심으로 Clean Swift를 해석하고 각 컴포넌트의 역할을 분리 혹은 재정의하였습니다. 주요 컴포넌트는 5개로, View, Controller, Interactor, Store, Worker가 존재합니다.

**ViewController**

→ 화면(View)과 유저 액션을 핸들링하는 로직(Controller)으로 분리하여 각각의 책임을 지게 하였습니다.

**Presenter**

→ 상태를 관리하고, 인터렉터의 결과를 반환받아 상태를 변경시키는 Store로 변화하였습니다.

**Interactor**

→ 기존과 동일하게 고수준의 비즈니스 로직만을 담당할 수 있도록 하였습니다.

**Worker**

→ 부수효과(SideEffect)를 처리하는 컴포넌트로 확장되었습니다.

Layer로는 3 Layer로 구분이 됩니다.

**Domain**

* 비즈니스 규칙이 존재하는 영역입니다.

**Interface Adapter**

* domain과 infrastructure 사이의 연결을 도와줍니다.

**Infrastructure**

* 외부 세계를 담당합니다.

저희는 이것을 CIS 패턴으로 명칭을 정의하였습니다.

## 템플릿과 예제

이해를 돕기 위해 CIS 패턴으로 작성된 템플릿과 예제를 첨부합니다.

* <https://github.com/spoqa/CleanSwift-CIS>

![drawing](https://github.com/spoqa/CleanSwift-CIS/blob/main/Images/Templates.png?raw=true)

템플릿은 Scene과 SPM 형태의 Scene, 그리고 각각의 컴포넌트를 만들수 있도록 구성하였습니다.

예제는 키친보드 서비스의 기능중 하나인 견적 요청 기능입니다. 명세표 이미지를 첨부하고 요청 사항을 추가하여 견적을 요청하는 기본적인 플로우를 담았습니다.

이제 각 컴포넌트별 부여된 역할과 세부적인 특징을 알아보겠습니다.

## View

View는 **어떻게 그려지는가**를 책임집니다.

**특징**

1. View는 고수준의 책임에서 완전히 분리됩니다.
   * 유저 행동의 시작점(Action)과 끝점(State). 그리고 그 과정은 View의 책임에서 분리합니다.
   * 유저의 트리거가 발생되면 Controller의 액션을 호출하고, ObservableObject 형태인 Store가 변경되면 화면을 변화시킵니다.
2. View에 어느 UI Framework를 사용하여도 고수준의 컴포넌트들에게 영향을 주지 않습니다.
   * UI에 대한 책임을 고수준에서 완전히 분리하기 때문에 UI Framework는 View 컴포넌트에서만 종속성을 띄게 됩니다.
   * UIKit, SwiftUI 등 다양한 UI Famework들에 대한 독립성을 이룰 수 있습니다.

    public struct UploadReceiptSwiftUIView: View {
        private let controller: UploadReceiptControllerable
        @ObservedObject private var store: UploadReceiptStore

        // ..

        public var body: some View {
            // ..
            .onTapGesture {
                self.controller.execute(.imageAttachTapped)
            }
        }
    }

    public final class UploadReceiptUIKitView: UIViewController {
        private let controller: UploadReceiptControllerable
        private var store: UploadReceiptStore

        // ..

        private func bind() {

            self.store.$state
                .map { $0.attachedImages }
                .sink { [weak self] attachedImages in
                    self?.updateImageScrollView(with: attachedImages)
                }
                .store(in: &self.cancellables)
        }
    }

+상태를 기반으로 렌더링하는 구조가 아닌 UIKit 등의 경우에는 First Party Library인 Combine을 사용해서 상태 값을 바인딩하도록 하였습니다.

## Controller

Controller는 **유저의 액션을 처리**합니다.

**특징**

1. Controller는 유저 행위의 시작점에서 도메인 계층에 대한 게이트웨이 역할을 합니다.
   * 비즈니스 로직을 실행하고자 한다면 Interactor의 유즈케이스를 호출합니다.
   * 단순한 상태, UI의 변화를 실행하고자 한다면 Store의 뮤테이션을 호출합니다.
   * 유저의 액션이 들어오면 이를 판단하여, 비즈니스 로직 혹은 상태 변화를 적절히 실행시킵니다.
2. Controller의 액션 함수는 순수 함수로 작성됩니다.
   * 액션 함수는 상태에 의존하지 않고 변경하지 않습니다. 동일한 입력에 항상 동일한 출력을 반환합니다.
   * Controller를 부수효과에 영향이 없도록 만들어 예측 가능성과 모듈화 수준을 높입니다.
   * 이를 위하여 Controller는 단방향으로 전달만 가능한 컴포넌트들에 의존합니다. 상태에 의존하지 않습니다.

    public enum UploadReceiptAction {
        // ..
        case cameraCanceled
        case imagePicked
    }

    final class UploadReceiptController: UploadReceiptControllerable {

        private let interactor: UploadReceiptInteractable
        private weak var store: UploadReceiptMutatable?

        // ..
    }

    extension UploadReceiptController {

        private func execute(_ action: UploadReceiptAction) async {
            switch action {
            // ..
            case .cameraCanceled:
                await self.store?.execute(.dismissCamera)

            case .imagePicked(let image):
                await self.interactor.execute(.attachImage(request: UploadReceipt.AttachImage.Request(imageUIData: image)))
                await self.store?.execute(.dismissImagePicker)
            }
        }
    }

## Interactor

Interactor는 **비즈니스 로직**을 담당합니다.

특징

1. Interactor는 화면의 모든 유즈케이스를 캡슐화하고 고립시킵니다.
   * Interactor는 단방향 사이클에서 자연스럽게 고수준의 유즈케이스를 분리할 수 있게끔 해줍니다.
   * Request, Response 모델을 통해 각각의 유즈케이스를 고립시킵니다.
   * 하나의 기능 변경이 다른 하나의 기능에 영향을 미치지 않도록 합니다.

![drawing](https://github.com/spoqa/CleanSwift-CIS/blob/main/Images/UseCase.png?raw=true)

    public enum UploadReceipt {
        // ..

        // MARK: - UseCases

        enum AttachImage {

            struct Request {
                let imageUIData: ImageUIDataModel
            }

            struct Response {
                let attachedImages: [ImageModel]
                let error: Error?

                enum Error {
                    case exceedImageCount
                    case failDataMapping
                }
            }
        }
    }

1. Interactor는 State에서 분리되어 고수준으로 고립된 **DomainState** 를 사용하여 비즈니스 로직을 구현합니다.
   * 상태의 목적에는 여러가지가 있을 수 있습니다. (View를 렌더링 하기 위해, 테스트를 하기 위해, 로깅을 하기 위해, 로직에 활용하기 위해 ..)
   * 이중에서 로직에 활용하기 위한 상태를 "도메인 상태"로 분리하고, Interactor는 이를 read only로 활용합니다.
   * 상태 관리 측면에서도 저수준과 고수준을 분리하며, 더욱더 외부에 의존하지 않는 도메인 계층을 만들 수 있습니다.

![drawing](https://github.com/spoqa/CleanSwift-CIS/blob/main/Images/DomainState.png?raw=true)

    enum UploadReceiptUseCase {
        case attachImage(request: UploadReceipt.AttachImage.Request)
        case uploadImage(request: UploadReceipt.UploadImage.Request)
        case saveImage(request: UploadReceipt.SaveImage.Request)
        case showCamera(request: UploadReceipt.ShowCamera.Request)
        case showGallery(request: UploadReceipt.ShowGallery.Request)
    }

    final class UploadReceiptInteractor: UploadReceiptInteractable {

        private let store: UploadReceiptMutatable & HasUploadReceiptDomainState
        private let worker: UploadReceiptWorkable

        // ..
    }

    extension UploadReceiptInteractor {

        func execute(_ useCase: UploadReceiptUseCase) async {
            switch useCase {
            // ..
            case .attachImage(let request):
                let response: UploadReceipt.AttachImage.Response
                let storedAttachedImages = await self.store.domainState.attachedImages

                if storedAttachedImages.count >= 5 {
                    response = UploadReceipt.AttachImage.Response(
                        attachedImages: storedAttachedImages,
                        error: .exceedImageCount
                    )
                }
                else if let imageData = self.worker.mapToData(from: request.imageUIData) {
                    response =  UploadReceipt.AttachImage.Response(
                        attachedImages: storedAttachedImages + [UploadReceipt.ImageModel(data: imageData, uiData: request.image)],
                        error: nil
                    )
                }
                else {
                    response = UploadReceipt.AttachImage.Response(
                        attachedImages: storedAttachedImages,
                        error: .failDataMapping
                    )
                }

                await self.store.execute(.mutateAttachImage(response: response))

            case .uploadImage(_):
                let response: UploadReceipt.UploadImage.Response
                let storedAttachedImages = await self.store.domainState.attachedImages

                if storedAttachedImages.isEmpty {
                    response =  UploadReceipt.UploadImage.Response(
                        uploadUrlObjectKeys: [],
                        error: .emptyAttachedImage
                    )
                }
                else {
                    do {
                        let uploadUrls = try await self.worker.fetchImageUploadUrls(names: storedAttachedImages.map({ $0.name }))
                        try await self.worker.requestImagesUpload(attatchedImages: storedAttachedImages, imageUploadUrls: uploadUrls)

                        response = UploadReceipt.UploadImage.Response(
                            uploadUrlObjectKeys: uploadUrls.map({ $0.objectKey }),
                            error: nil
                        )
                    }
                    catch {
                        response = UploadReceipt.UploadImage.Response(
                            uploadUrlObjectKeys: [],
                            error: .default(error)
                        )
                    }
                }

                await self.store.execute(.mutateUploadImage(response: response))
            }
        }
    }

## Store

Store는 **상태를 관리하고 변경**시키는 역할을 담당합니다.

특징

1. Store는 상태를 한 곳에서 만들어지고 관리될 수 있도록 합니다.
   * 상태에 대한 setter를 private으로 관리하여 외부에서 상태를 변경할 수 없도록 합니다.
   * 뮤테이션 함수에서는 상태를 변경하는 대신, 업데이트된 복사본을 새로 만들어 기존 상태를 덮어씌웁니다.
   * 상태 객체가 어디서든 변경될 수 있는 가능성을 제거하여 예측 가능한 동작을 하도록 합니다.
2. Store의 뮤테이션 함수는 외부 세계의 상태를 변화시켜야하는 상황에 대응합니다.
   * 뮤테이션을 통해서 상태를 변화시키고자 하였으니, 상태가 화면의 상태가 아닌 경우가 존재합니다. (토스트 메세지 표출 등)
   * 뮤테이션 함수에서는 Worker 함수를 호출하여 이러한 외부 상태를 변경하는 부수효과를 처리합니다.

![drawing](https://github.com/spoqa/CleanSwift-CIS/blob/main/Images/Mutation.png?raw=true)

    enum UploadReceiptMutation {
        case mutateAttachImage(response: UploadReceipt.AttachImage.Response)
        // ..
        case dismissCamera
        case dismissImagePicker
    }

    @MainActor public struct UploadReceiptState {
        // ..
        struct DomainState {
            // ..
        }
    }

    @MainActor final class UploadReceiptStore: UploadReceiptMutatable, HasUploadReceiptDomainState, ObservableObject {

        let worker: UploadReceiptWorkable
        @Published private(set) var state: UploadReceiptState
        // ..
    }

    extension UploadReceiptStore {

        private func execute(state: UploadReceiptState, mutation: UploadReceiptMutation) -> UploadReceiptState {
            var state = state

            switch mutation {
            case .mutateAttachImage(let response):
                if let error = response.error {
                    switch error {
                    case .exceedImageCount:
                        self.worker.showToast(message: "최대 5장까지 첨부할 수 있습니다")

                    case .failDataMapping:
                        self.worker.showToast(message: "사진 처리 과정에서 오류가 발생하였습니다")
                    }
                }
                else {
                    state.domainState.attachedImages = response.attachedImages
                    state.attachedImages = response.attachedImages.map { $0.uiData }
                }
            // ..
            case .dismissCamera:
                state.showingCamera = false

            case .dismissImagePicker:
                state.showingImagePicker = false
            }

            return state
        }
    }

## Worker

Worker는 **부수효과(SideEffect)를 처리하고, 복잡도를 낮추는 역할**을 합니다.

\*부수효과(SideEffect)

* 상태 변화를 유발하지 않거나(예: 앱로깅 등), 복잡하고 예측 불가능한 작업(예: 네트워크 요청 등)

특징

1. Worker는 상태를 예측 가능하도록 만듭니다.
   * 예측이 불가능한 작업인 부수효과를 처리하여 화면의 상태를 예측 가능하도록 만듭니다.
2. Worker는 모든 컴포넌트들을 순수하게 만들 수 있도록 합니다.
   * Worker가 주입되는 컴포넌트는 Interactor에 국한되지 않습니다.
   * Worker는 부수효과가 발생될 수 있는 모든 컴포넌트들에 주입되고 부수효과들을 제어합니다.
   * ex)
     * Controller : Logging
     * Interactor : Database, Server
     * Store : Toast Message

![drawing](https://github.com/spoqa/CleanSwift-CIS/blob/main/Images/Worker.png?raw=true)

    protocol UploadReceiptWorkable: AnyObject {
        // ..

        @MainActor func showToast(message: String)

        func requestImagesUpload(attatchedImages: [UploadReceipt.ImageModel], imageUploadUrls: [UploadReceipt.ImageUploadUrl]) async throws
        func requestCameraPermission() async -> Bool
        func requestGalleryPermission() async -> Bool
    }

    final class UploadReceiptWorker: UploadReceiptWorkable {

        private let imageUploadNetworkService: ImageUploadNetworkServiceProtocol

        // ..
    }

    extension UploadReceiptWorker {

        @MainActor func showToast(message: String) {
            Toast(text: message).show()
        }

        func requestImagesUpload(attatchedImages: [UploadReceipt.ImageModel], imageUploadUrls: [UploadReceipt.ImageUploadUrl]) async throws {
            return try await withThrowingTaskGroup(of: Void.self) { group in
                for (imageUploadUrl, attachedImage) in zip(imageUploadUrls, attatchedImages) {
                    group.addTask {
                        try await self.imageUploadNetworkService.putImageData(to: imageUploadUrl.uploadUrl, imageData: attachedImage.data)
                    }
                }
                try await group.waitForAll()
            }
        }

        func requestCameraPermission() async -> Bool {
            return await withCheckedContinuation { continuation in
                AVCaptureDevice.requestAccess(for: .video) { granted in
                    continuation.resume(returning: granted)
                }
            }
        }

        func requestGalleryPermission() async -> Bool {
            return await withCheckedContinuation { continuation in
                if #available(iOS 14, *) {
                    PHPhotoLibrary.requestAuthorization(for: .readWrite) { status in
                        continuation.resume(returning: status == .authorized)
                    }
                } else {
                    PHPhotoLibrary.requestAuthorization { status in
                        continuation.resume(returning: status == .authorized)
                    }
                }
            }
        }
    }

## Models

Model은 화면에서 사용되는 Entity와 ViewModel, UseCaseModel(Request, Response)을 명세합니다.

특징

1. Entity는 도메인 계층에서 사용되는 객체입니다.
   * 비즈니스 로직에 활용되며 Interactor와 Worker의 계층간 이동에 사용됩니다.
   * 비즈니스 로직을 담당하는 Interactor가 저수준에 의존하지 않도록 합니다.
2. ViewModel은 화면 렌더링에 사용되는 객체입니다.
   * 실질적으로 화면에 그려질 날것의 값들을 포함합니다.
   * Store의 뮤테이션 함수를 통해 만들어지며 Store와 View의 계층간 이동에 사용됩니다.
   * View에서 불필요한 매핑 로직을 작성하지 않도록 도와주고 화면을 그리는것에만 집중할 수 있도록 합니다.
3. UseCaseModel은 각 UseCase의 Input과 Output 객체입니다.
   * Input인 Request는 Controller와 Interactor의 계층간 이동에 사용됩니다.
   * Output인 Response는 Interactor와 Store의 계층간 이동에 사용됩니다.
   * 화면에서 발생할 수 있는 UseCase를 캡슐화하고 추적에 용이하게 만듭니다.

    public enum UploadReceipt {

        // MARK: - Entities

        public struct ImageModel {
            let name: String = "\(Date().timeIntervalSince1970)_\(UUID())"
            let data: Data
            let uiData: ImageUIDataModel
        }

        // MARK: - ViewModels

        public typealias ImageUIDataModel = UIImage

        // MARK: - UseCases

        enum AttachImage {

            struct Request {
                let imageUIData: ImageUIDataModel
            }

            struct Response {
                let attachedImages: [ImageModel]
                let error: Error?

                enum Error {
                    case exceedImageCount
                    case failDataMapping
                }
            }
        }
    }

## 플로우

주요 컴포넌트의 역할과 특징을 알아보았습니다.

이해를 돕고자 명세표 이미지 첨부 플로우를 예시로 CIS 사이클의 동작 방식을 표현하였습니다.

![drawing](https://github.com/spoqa/CleanSwift-CIS/blob/main/Images/Flow-Example.gif?raw=true)

## 쓰레드 관리

구조의 안정성을 높이기 위해서는 쓰레드 관리 방식 또한 고려가 되어야 했습니다.

가장 우선적으로 고려하였던 점은 아래와 같습니다

* Swift Concurrency를 사용합니다.
  * Swift Concurrency는 GCD와 비교하여 가독성과 성능이 우수한 API로써 앞으로의 iOS 동시성 프로그래밍 표준이라고 보았기에 이를 바탕으로 구상하였습니다.
* 액션간의 독립성을 제공합니다.
  * 유저의 액션은 각각 독립적으로 움직이며 서로의 액션이 서로에게 영향을 주지 않도록 합니다.
* 상태 관리는 단일 쓰레드에서 될 수 있도록 합니다.
  * 상태가 여러 쓰레드에서 수정 및 참조되어 동시성 문제가 발생되지 않도록 합니다.

이 점들을 바탕으로 쓰레드 관리 방식을 설계하였습니다.

![drawing](https://github.com/spoqa/CleanSwift-CIS/blob/main/Images/Thread.png?raw=true)

1. 유저의 액션이 발생되면 Task를 생성하고, 액션을 통해 실행되는 작업들은 하나의 Task로 묶이도록 합니다.
2. 상태를 변경하거나 참조할때는 Main Thread로 다시 격리 시킵니다.
3. 병렬화되어 실행되었던 유저 액션들이 다시 직렬화되어 상태를 관리합니다.

설계한 쓰레드 관리 방식을 일관되게 행하기 위하여 각각의 컴포넌트의 실행 지점을 enum으로 명세하고 하나의 함수로 실행시키도록 하였습니다.

    // Controller
    public protocol UploadReceiptControllerable: AnyObject {
        @discardableResult func execute(_ action: UploadReceiptAction) -> Task<Void, Never>
    }

    // Interactor
    protocol UploadReceiptInteractable {
        func execute(_ useCase: UploadReceiptUseCase) async
    }

    // Store
    protocol UploadReceiptMutatable: AnyObject {
        @MainActor func execute(_ mutation: UploadReceiptMutation)
    }

## 테스팅

현재 스포카 iOS 플랫폼에서는 BDD 방식에 의거하여, 보편어로 테스트 시나리오를 명세하고 이를 통합 테스트 코드로 작성합니다.

이러한 시나리오를 기반으로 하는 통합 테스트는 요구사항의 누락을 줄이며 이해도를 높히고 사양을 명확하게 할 수 있었습니다.

|     Feature     |              Scenario               |  Given (전제)   |    When (조건)     |                    Then (결과)                     |
|-----------------|-------------------------------------|---------------|------------------|--------------------------------------------------|
| 사진 첨부 수단 선택     |                                     |               |                  |                                                  |
|                 | 사진 첨부 버튼 클릭 \> 사진 첨부 수단 시트 표출       |               | 사진 첨부 버튼 클릭      | 사진 첨부 수단 시트 표출됨                                  |
| 카메라 표출          |                                     |               |                  |                                                  |
|                 | 사진 촬영하기 옵션 클릭 \> 사진 첨부 수단 시트 미표출    |               | 사진 촬영하기 옵션 클릭    | 사진 첨부 수단 시트 표출되지 않음                              |
|                 |                                     |               |                  | ...                                              |
| 이미지 피커 (갤러리) 표출 |                                     |               |                  |                                                  |
|                 | 사진첩에서 가져오기 옵션 클릭 \> 사진 첨부 수단 시트 미표출 |               | 사진첩에서 가져오기 옵션 클릭 | 사진 첨부 수단 시트 표출되지 않음                              |
|                 |                                     |               |                  | ...                                              |
| 카메라 촬영          |                                     |               |                  |                                                  |
|                 | 카메라 촬영 취소 \> 카메라 미표출                |               | 카메라 촬영 취소        | 카메라가 표출되지 않음                                     |
|                 |                                     |               |                  | ...                                              |
| 갤러리 사진 선택       |                                     |               |                  |                                                  |
|                 | 사진 선택 취소 \> 이미지 피커 미표출              |               | 사진 선택 취소         | 이미지 피커가 표출되지 않음                                  |
|                 |                                     |               |                  | ...                                              |
| 이미지 업로드         |                                     |               |                  |                                                  |
|                 | 다음 버튼 클릭 \> 첨부된 사진 0개 \> 토스트 메세지 표출 | 첨부된 사진이 0개이다. | 다음 버튼 클릭         | "견적 요청을 하기 위해서\\n필수로 이미지를 첨부하여야 합니다" 토스트 메세지 표출됨 |
|                 |                                     |               |                  | ...                                              |

AS-IS 구조의 경우에는, 통합 테스트 코드를 작성할때 UI에 의존적인 컴포넌트인 ViewController에 접근해야 하였습니다.

UI에 의존적인 통합 테스트 코드는 세부사항인 UI 및 외부 Framework의 변경이 전체 테스트 코드에 영향을 주었고, 이때문에 안정적인 시나리오 기반의 테스트 코드 작성에 어려움을 겪었습니다.

![drawing](https://github.com/spoqa/CleanSwift-CIS/blob/main/Images/ASIS-Test.png?raw=true)

TO-BE 구조에서는, 유저의 액션과 상태가 UI에 분리되어 UI에 접근하지 않고도.

State를 통해 Given을 정의할 수 있고, Controller를 통해 When을 실행할 수 있고, State를 통해 Then을 검증할 수 있습니다.

이를 통해 외부에 의존적이지 않고 보편적인 시나리오에 집중할 수 있는 통합 테스트 코드를 작성할 수 있었습니다.

![drawing](https://github.com/spoqa/CleanSwift-CIS/blob/main/Images/TOBE-Test.png?raw=true)

    final class UploadReceiptSceneTests: XCTestCase {

        var controller: UploadReceiptController!
        @MainActor var state: UploadReceiptState { self.store.state }

        // ..

        func test_사진선택완료_첨부된사진5개이상__토스트메세지표출됨() async {
            // Given
            await MainActor.run {
                self.mockWorker.mapToDataResult = Data()

                var state = UploadReceiptState()
                state.domainState.attachedImages = [
                    UploadReceipt.ImageModel(data: Data(), uiData: UIImage()),
                    UploadReceipt.ImageModel(data: Data(), uiData: UIImage()),
                    UploadReceipt.ImageModel(data: Data(), uiData: UIImage()),
                    UploadReceipt.ImageModel(data: Data(), uiData: UIImage())
                ]
                self.configure(initialState: state)
            }

            // When
            await self.controller.execute(.imagePicked(image: UploadReceipt.ImageUIDataModel())).value

            // Then
            let lastShowToastMessage = self.mockWorker.lastShowToastMessage

            XCTAssertEqual(lastShowToastMessage, "최대 5장까지 첨부할 수 있습니다")
        }

        func test_사진선택완료_첨부된사진5개미만__첨부된이미지목록에추가됨() async {
            // Given
            await MainActor.run {
                self.mockWorker.mapToDataResult = Data()

                var state = UploadReceiptState()
                state.domainState.attachedImages = [
                    UploadReceipt.ImageModel(data: Data(), uiData: UIImage()),
                    UploadReceipt.ImageModel(data: Data(), uiData: UIImage()),
                    UploadReceipt.ImageModel(data: Data(), uiData: UIImage()),
                    UploadReceipt.ImageModel(data: Data(), uiData: UIImage())
                ]
                self.configure(initialState: state)
            }

            // When
            await self.controller.execute(.imagePicked(image: UploadReceipt.ImageUIDataModel())).value

            // Then
            let domainAttachedImages = await self.state.domainState.attachedImages
            let attachedImages = await self.state.attachedImages

            XCTAssertEqual(domainAttachedImages.count, 5)
            XCTAssertEqual(attachedImages.count, 5)
        }
    }

    extension UploadReceiptSceneTests {

        class MockWorker: UploadReceiptWorkable {
            // ..
        }
    }

## 화면간의 통신

복수의 화면들이 존재할때는 이 화면들간의 데이터 전달이나 흐름의 위임이 빈번하게 일어납니다.

이러한 화면간의 통신 방법또한 룰을 정의하여 구조화하였습니다.

화면간의 통신에서 대응되어야하는 사항은 아래와 같습니다.

* 화면이 그려지기 위한 초기값을 전달받아야합니다.
* 흐름을 서로 위임할 수 있어야 합니다.

먼저 화면이 그려지기 위한 초기값을 전달 받기 위해서 View가 생성될때 initialState를 받도록 하였습니다.

상위 화면 상태에 전달할 값을 저장하고 하위 화면을 생성할때 initialState로 값을 전달합니다.

    // 전달할 상태 값 저장
    extension UploadReceiptStore {

        private func execute(state: UploadReceiptState, mutation: UploadReceiptMutation) -> UploadReceiptState {
            var state = state

            switch mutation {
            case .mutateUploadImage(let response):
                state.receiptImageUploadUrlObjectKeys = response.uploadUrlObjectKeys // Data Passing
                state.isAddRequestsViewActive = true // Active AddRequests View
            // ..
            }

            return state
        }
    }

    // 상위 뷰
    public struct UploadReceiptSwiftUIView: View {

            public var body: some View {
            NavigationView {
                // ..
                    NavigationLink(
                        isActive: Binding(
                            get: {
                                return self.store.state.isAddRequestsViewActive
                            },
                            // ..
                        ),
                        destination: {
                            AddRequestsSwiftUIView(
                                initialState: AddRequestsState(
                                    receiptImageUploadUrlObjectKeys: self.store.state.receiptImageUploadUrlObjectKeys
                                ),
                                // ..
                            )
                        }
                    )
            // ..
    }

    // 하위 뷰
    public struct AddRequestsSwiftUIView: View {

        public init(
            initialState: AddRequestsState,
            // ..
        ) {
            // ..
        }
    }

다른 화면으로 위임되는 흐름은 부수효과(SideEffect)로 해석하였습니다.

그래서 부수효과를 담당하는 Worker를 통해 서로 통신하도록 하였고 위임된 흐름은 Controller로 흘러가게 설계하였습니다.

![drawing](https://github.com/spoqa/CleanSwift-CIS/blob/main/Images/Communication.png?raw=true)

Worker는 상위 화면에 흐름을 위임 시킬수 있도록 Delegate를 갖습니다. 그리고 하위 화면에 흐름을 위임 시킬수 있도록 하위 화면의 Controller를 갖습니다.

Delegate는 View가 생성될 때 상위 화면에서 주입받도록 하였고, Controller는 inout 키워드를 통해 하위 화면이 생성되면 상위 화면에 할당하도록 하였습니다.

    // 상위 화면의 Worker
    protocol UploadReceiptWorkable: AnyObject {
        var addRequestsController: AddRequestsControllerable? { get set }
    }

    // 상위 화면에서 하위 화면에 의해 흐름을 위임 받는 로직
    extension UploadReceiptController: AddRequestsDelegate {

        @MainActor func quotationRequestSuccessed(successMessage: String) {
            self.store?.execute(.setIsActiveAddRequestsView(isActive: false))
            self.store?.execute(.showMessage(message: successMessage))
            self.store?.execute(.clearAttachedImages)
        }
    }

    // 상위 화면에서 하위 화면에게 흐름을 위임 시키는 로직
    extension UploadReceiptStore {

        private func execute(state: UploadReceiptState, mutation: UploadReceiptMutation) -> UploadReceiptState {
            var state = state

            switch mutation {
            case .mutateSomthing(_):
                self.worker.addRequestsController?.execute(.something)
            // ..
            }

            return state
        }
    }

    // 하위 화면의 Delegate
    public protocol AddRequestsDelegate: AnyObject {
        @MainActor func quotationRequestSuccessed(successMessage: String)
    }

    // 하위 화면의 Worker
    protocol AddRequestsWorkable: AnyObject {
        var delegate: AddRequestsDelegate? { get set }
    }

    // 하위 화면에서 상위 화면에게 흐름을 위임 시키는 로직
    extension AddRequestsStore {

        func execute(state: AddRequestsState, mutation: AddRequestsMutation) -> AddRequestsState {
            var state = state

            switch mutation {
            case .mutateRequestQuotation(let response):
                self.worker.delegate?.quotationRequestSuccessed(successMessage: "견적 요청을 성공하였습니다 :)")
            // ..
            }

            return state
        }
    }

    // 하위 뷰
    public struct AddRequestsSwiftUIView: View {

        public init(
            initialState: AddRequestsState,
            controller: inout AddRequestsControllerable?,
            delegate: AddRequestsDelegate
        ) {
            let worker = AddRequestsWorker(delegate: delegate, quotationNetworkService: quotationNetworkService)
            let _controller = AddRequestsController(interactor: interactor, store: store)
            controller = _controller
            // ..
        }
    }

## 마무리

지금까지 스포카 iOS 플랫폼에서 Clean Swift에 겪었던 어려움과 이를 극복하기 위해 개선한 구조를 알아보았습니다.

Clean Swift를 만든 Raymond의 말을 빌려, 저희는 완벽하지 않습니다. 더 나은 방법이 존재할 가능성이 큽니다. 그러나 저희의 여정이 같은 고민을 가지고 있는 분들에게 조금이나마 도움이 되었으면 좋겠습니다.

스포카는 매장의 식자재 걱정을 덜어주는 편리한 서비스를 만들어가고 있습니다. 모바일 챕터는 정답을 찾아가는 과정에서 발생되는 앱차원의 여러 문제들을 유연하고 단순하게 만들어야하는 책임을 가지고 있습니다.

이러한 책임을 바탕으로 또 다른 문제를 해결한 경험을 가지고 다른 글로 찾아뵙도록 하겠습니다.

긴 글 읽어주셔서 감사합니다.

스포카에서는 "식자재 시장을 디지털화한다" 라는 슬로건 아래, 매장과 식자재 유통사에 도움되는 여러 솔루션들을 개발하고 있습니다.

**더 나은 제품으로 세상을 바꾸는 성장의 과정에 동참 하실 분들은 [채용 정보](https://spoqa.co.kr/careers/) 페이지를 확인해주세요!**