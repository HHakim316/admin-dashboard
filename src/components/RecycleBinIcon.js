import { IconButton, Badge, Tooltip } from "@chakra-ui/react";
import { FiTrash2 } from "react-icons/fi";

export const RecycleBinIcon = ({ count, onClick }) => (
  <Tooltip label="Recycle Bin">
    <IconButton
      icon={
        <>
          <FiTrash2 />
          {count > 0 && (
            <Badge 
              ml={1} 
              colorScheme="red" 
              borderRadius="full"
              fontSize="0.6em"
            >
              {count}
            </Badge>
          )}
        </>
      }
      onClick={onClick}
      variant="ghost"
      aria-label="Recycle Bin"
    />
  </Tooltip>
);