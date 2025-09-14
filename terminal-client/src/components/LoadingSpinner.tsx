import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

type Props = {
    text?: string;
};

function LoadingSpinner({ text = 'Loading...' }: Props) {
    return (
        <Box>
            <Text color="cyan">
                <Spinner type="dots" />
            </Text>
            <Text> {text}</Text>
        </Box>
    );
}

export default LoadingSpinner;
