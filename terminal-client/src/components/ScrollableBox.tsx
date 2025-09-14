import { ReactNode, useState, useEffect, useRef } from 'react';

import { Box, Text, useInput, measureElement, DOMElement } from 'ink';

type Props = {
    children: ReactNode;
    height?: number;
    showScrollIndicator?: boolean;
};

function ScrollableBox({ children, height = 10, showScrollIndicator = true }: Props) {
    const [scrollOffset, setScrollOffset] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const boxRef = useRef<DOMElement>(null);

    // Measure content height, re-measure when children change
    useEffect(() => {
        if (boxRef.current) {
            const { height: measuredHeight } = measureElement(boxRef.current);
            setContentHeight(measuredHeight);
        }
    }, [children]);

    // Auto-scroll to bottom when new content is added
    useEffect(() => {
        const maxScroll = Math.max(0, contentHeight - height);
        setScrollOffset(maxScroll);
    }, [contentHeight, height]);

    useInput((_input, key) => {
        const maxScroll = Math.max(0, contentHeight - height);

        if (key.upArrow) {
            setScrollOffset((offset) => Math.max(0, offset - 1));
        } else if (key.downArrow) {
            setScrollOffset((offset) => Math.min(maxScroll, offset + 1));
        } else if (key.pageUp) {
            setScrollOffset((offset) => Math.max(0, offset - height));
        } else if (key.pageDown) {
            setScrollOffset((offset) => Math.min(maxScroll, offset + height));
        }
    });

    const visibleContent = Array.isArray(children) ? children.slice(scrollOffset, scrollOffset + height) : children;

    const hasScrollUp = scrollOffset > 0;
    const hasScrollDown = scrollOffset < Math.max(0, contentHeight - height);

    return (
        <Box flexDirection="column" height={height}>
            <Box ref={boxRef} flexDirection="column" flexGrow={1}>
                {visibleContent}
            </Box>
            {showScrollIndicator && (hasScrollUp || hasScrollDown) && (
                <Box justifyContent="flex-end">
                    <Text dimColor>
                        {hasScrollUp && '↑ '}
                        {hasScrollUp && hasScrollDown && '/'}
                        {hasScrollDown && ' ↓'}
                    </Text>
                </Box>
            )}
        </Box>
    );
}

export default ScrollableBox;
