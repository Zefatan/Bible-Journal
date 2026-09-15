import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:url_launcher/url_launcher.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock to portrait on Android; allow all orientations on Windows/desktop
  if (Platform.isAndroid || Platform.isIOS) {
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
  }

  // Start the localhost server that serves the bundled React app
  final server = InAppLocalhostServer(
    port: 8080,
    documentRoot: 'assets/web',
  );
  await server.start();

  runApp(const BibleJournalApp());
}

class BibleJournalApp extends StatelessWidget {
  const BibleJournalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Daily Bible Journal',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF5C3D1E),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const JournalWebView(),
    );
  }
}

class JournalWebView extends StatefulWidget {
  const JournalWebView({super.key});

  @override
  State<JournalWebView> createState() => _JournalWebViewState();
}

class _JournalWebViewState extends State<JournalWebView> {
  InAppWebViewController? _webViewController;
  bool _isLoading = true;
  double _loadingProgress = 0;

  final _initialSettings = InAppWebViewSettings(
    // Allow localStorage (required for journal persistence)
    allowFileAccessFromFileURLs: true,
    allowUniversalAccessFromFileURLs: true,
    javaScriptEnabled: true,
    domStorageEnabled: true,
    databaseEnabled: true,
    // Transparent background so our dark scaffold shows during load
    transparentBackground: true,
    // Prevent zooming — the React app already handles responsive layout
    supportZoom: false,
    builtInZoomControls: false,
    displayZoomControls: false,
    // Android hardware acceleration
    hardwareAcceleration: true,
    // User agent — identify as mobile/desktop appropriately
    userAgent: Platform.isAndroid
        ? 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 BibleJournal/1.0'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 BibleJournal/1.0',
  );

  @override
  Widget build(BuildContext context) {
    return PopScope(
      // Handle Android back button — go back in WebView history instead of exiting
      canPop: false,
      onPopInvoked: (didPop) async {
        if (_webViewController != null) {
          final canGoBack = await _webViewController!.canGoBack();
          if (canGoBack) {
            await _webViewController!.goBack();
          } else {
            // Nothing to go back to — show exit confirmation
            if (context.mounted) {
              final shouldExit = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  backgroundColor: const Color(0xFF3D2512),
                  title: const Text(
                    'Exit app?',
                    style: TextStyle(color: Color(0xFFE8D5B7)),
                  ),
                  content: const Text(
                    'Your journal is saved. Are you sure you want to exit?',
                    style: TextStyle(color: Color(0xFFBCA98A)),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(ctx).pop(false),
                      child: const Text(
                        'Stay',
                        style: TextStyle(color: Color(0xFFD4A853)),
                      ),
                    ),
                    TextButton(
                      onPressed: () => Navigator.of(ctx).pop(true),
                      child: const Text(
                        'Exit',
                        style: TextStyle(color: Color(0xFFBCA98A)),
                      ),
                    ),
                  ],
                ),
              );
              if (shouldExit == true && context.mounted) {
                SystemNavigator.pop();
              }
            }
          }
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF2C1A0E),
        body: Stack(
          children: [
            // The WebView
            SafeArea(
              child: InAppWebView(
                initialUrlRequest: URLRequest(
                  url: WebUri('http://localhost:8080/index.html'),
                ),
                initialSettings: _initialSettings,
                onWebViewCreated: (controller) {
                  _webViewController = controller;
                },
                onLoadStart: (controller, url) {
                  setState(() => _isLoading = true);
                },
                onProgressChanged: (controller, progress) {
                  setState(() => _loadingProgress = progress / 100.0);
                },
                onLoadStop: (controller, url) async {
                  setState(() => _isLoading = false);
                },
                onLoadError: (controller, url, code, message) {
                  setState(() => _isLoading = false);
                  debugPrint('WebView error: $code — $message');
                },
                // Intercept navigation: open external links (commentary, Bible Gateway, etc.)
                // in the system browser rather than inside the WebView
                shouldOverrideUrlLoading: (controller, navigationAction) async {
                  final url = navigationAction.request.url.toString();
                  // Keep localhost traffic inside the WebView
                  if (url.startsWith('http://localhost')) {
                    return NavigationActionPolicy.ALLOW;
                  }
                  // Open everything else externally
                  final uri = Uri.parse(url);
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                  return NavigationActionPolicy.CANCEL;
                },
                onConsoleMessage: (controller, message) {
                  debugPrint('[WebView console] ${message.message}');
                },
              ),
            ),

            // Splash / loading overlay
            if (_isLoading)
              AnimatedOpacity(
                opacity: _isLoading ? 1.0 : 0.0,
                duration: const Duration(milliseconds: 300),
                child: Container(
                  color: const Color(0xFF2C1A0E),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // App icon placeholder — a simple cross in a circle
                        Container(
                          width: 96,
                          height: 96,
                          decoration: BoxDecoration(
                            color: const Color(0xFF5C3D1E),
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: const Icon(
                            Icons.menu_book_rounded,
                            color: Color(0xFFE8D5B7),
                            size: 56,
                          ),
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          'Daily Bible Journal',
                          style: TextStyle(
                            color: Color(0xFFE8D5B7),
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 32),
                        SizedBox(
                          width: 200,
                          child: LinearProgressIndicator(
                            value: _loadingProgress > 0 ? _loadingProgress : null,
                            backgroundColor: const Color(0xFF3D2512),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              Color(0xFFD4A853),
                            ),
                            borderRadius: BorderRadius.circular(4),
                            minHeight: 4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
