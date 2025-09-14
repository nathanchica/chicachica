import { Box, Text } from 'ink';

function SplashScreen() {
    return (
        <Box flexDirection="column" alignItems="center" paddingY={1}>
            {/* ASCII Art Logo with Emerald Gradient Effect using Hex Colors */}
            <Box flexDirection="column" alignItems="center">
                <Text color="#34d399" bold>
                    {
                        '   █████████  █████       ███                       █████████  █████       ███                    '
                    }
                </Text>
                <Text color="#34d399" bold>
                    {
                        '  ███▒▒▒▒▒███▒▒███       ▒▒▒                       ███▒▒▒▒▒███▒▒███       ▒▒▒                     '
                    }
                </Text>
                <Text color="#10b981" bold>
                    {
                        ' ███     ▒▒▒  ▒███████   ████   ██████   ██████   ███     ▒▒▒  ▒███████   ████   ██████   ██████  '
                    }
                </Text>
                <Text color="#10b981" bold>
                    {
                        '▒███          ▒███▒▒███ ▒▒███  ███▒▒███ ▒▒▒▒▒███ ▒███          ▒███▒▒███ ▒▒███  ███▒▒███ ▒▒▒▒▒███ '
                    }
                </Text>
                <Text color="#059669" bold>
                    {
                        '▒███          ▒███ ▒███  ▒███ ▒███ ▒▒▒   ███████ ▒███          ▒███ ▒███  ▒███ ▒███ ▒▒▒   ███████ '
                    }
                </Text>
                <Text color="#047857" bold>
                    {
                        '▒▒███     ███ ▒███ ▒███  ▒███ ▒███  ███ ███▒▒███ ▒▒███     ███ ▒███ ▒███  ▒███ ▒███  ███ ███▒▒███ '
                    }
                </Text>
                <Text color="#047857" bold>
                    {
                        ' ▒▒█████████  ████ █████ █████▒▒██████ ▒▒████████ ▒▒█████████  ████ █████ █████▒▒██████ ▒▒████████'
                    }
                </Text>
                <Text color="#065f46" bold>
                    {
                        '  ▒▒▒▒▒▒▒▒▒  ▒▒▒▒ ▒▒▒▒▒ ▒▒▒▒▒  ▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒  ▒▒▒▒ ▒▒▒▒▒ ▒▒▒▒▒  ▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒ '
                    }
                </Text>
            </Box>

            {/* Decorative Line */}
            <Box marginTop={1}>
                <Text color="#059669">{'━'.repeat(100)}</Text>
            </Box>

            {/* Tagline */}
            <Box flexDirection="column" marginTop={1} alignItems="center">
                <Text dimColor italic>
                    From the Filipino term, &quot;Chika Chika&quot;
                </Text>
                <Text dimColor italic>
                    Meaning &quot;chit-chat&quot;, gossip, or casual conversation
                </Text>
            </Box>
        </Box>
    );
}

export default SplashScreen;
