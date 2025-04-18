# scripts/rag_markdown_optimizer.py
import os
import re
import logging
import argparse
import sys
from datetime import datetime

# --- Configuration ---
REFERENCE_SECTION_PATTERNS = [
    r"^\s*##\s+References\s*$",  # ## References
    r"^\s*References\s*\n-{3,}\s*$",  # References\n---
    r"^\s*##\s+Notes\s*$",       # ## Notes (Added)
]
# Regex to find (Author, [Year](URL "Citation")) and capture Author and Year
# Updated to handle newlines in the citation title attribute using [\s\S]+?
CITATION_PATTERN = re.compile(r"\(([^,]+),\s*\[(\d{4})\]\([^)]+\s+\"([\s\S]+?)\"\)\)")
# Regex to find [Footnote N](#...) and capture [Footnote N]
FOOTNOTE_PATTERN = re.compile(r"(\[Footnote\s+\d+\])\(#[^)]+\)")

LOG_FILE_NAME = f"rag_optimizer_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

# --- Setup ---
def setup_logging():
    """Configures logging to output to both console and a file."""
    log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

    # File Handler
    file_handler = logging.FileHandler(LOG_FILE_NAME)
    file_handler.setFormatter(log_formatter)
    file_handler.setLevel(logging.INFO)

    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(log_formatter)
    console_handler.setLevel(logging.INFO)

    # Get root logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO) # Set root logger level
    # Clear existing handlers if any (important for re-runs in some environments)
    if logger.hasHandlers():
        logger.handlers.clear()
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    logging.info(f"Logging initialized. Log file: {LOG_FILE_NAME}")


def parse_arguments():
    """Parses command-line arguments."""
    parser = argparse.ArgumentParser(description="Optimize Markdown files for RAG by simplifying citations and footnotes.")
    parser.add_argument("directory", help="The directory containing Markdown files to process.")
    return parser.parse_args()

# --- Core Logic ---

def find_markdown_files(directory_path):
    """Recursively finds all .md files in the given directory."""
    markdown_files = []
    logging.info(f"Searching for Markdown files in: {directory_path}")
    try:
        for root, _, files in os.walk(directory_path):
            for file in files:
                if file.lower().endswith(".md"):
                    markdown_files.append(os.path.join(root, file))
    except Exception as e:
        logging.error(f"Error walking directory {directory_path}: {e}")
    logging.info(f"Found {len(markdown_files)} Markdown files.")
    return markdown_files

def find_references_start(lines):
    """Finds the starting line index of the References section."""
    for index, line in enumerate(lines):
        # Check subsequent line for '---' pattern if needed
        current_line_content = line.strip()
        next_line_content = lines[index + 1].strip() if index + 1 < len(lines) else ""

        for pattern_str in REFERENCE_SECTION_PATTERNS:
            # Handle multi-line patterns specifically
            if "\\n" in pattern_str:
                 # Check if the current line matches the first part and the next line matches the second
                 parts = pattern_str.split("\\n")
                 # Simple check, might need refinement based on exact regex needs
                 if re.match(parts[0], current_line_content, re.IGNORECASE) and re.match(parts[1], next_line_content, re.IGNORECASE):
                     return index # Return the index of the first line of the pattern match
            # Handle single-line patterns
            elif re.match(pattern_str, current_line_content, re.IGNORECASE):
                return index
    return -1 # Indicate not found

def process_markdown_file(file_path):
    """Processes a single Markdown file to simplify citations and footnotes."""
    try:
        logging.info(f"Processing file: {file_path}")

        # Read file content
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
        except UnicodeDecodeError:
             logging.warning(f"Could not decode {file_path} as UTF-8. Skipping.")
             return False
        except Exception as e:
            logging.error(f"Error reading file {file_path}: {e}")
            return False


        # Find where the main content ends (start of references)
        references_start_index = find_references_start(lines)

        # Separate main content and references
        if references_start_index != -1:
            main_content_lines = lines[:references_start_index]
            reference_content_lines = lines[references_start_index:]
            main_content = "".join(main_content_lines)
            logging.debug(f"References section found at line {references_start_index + 1} in {file_path}") # +1 for 1-based indexing
        else:
            main_content = "".join(lines)
            reference_content_lines = [] # No references section
            logging.warning(f"No references section found in {file_path}. Processing entire file.")

        # Perform replacements on main content only
        # 1. Simplify citations: (Author, [Year](URL "Citation")) -> (Author, Year)
        modified_content, citation_subs = CITATION_PATTERN.subn(r"(\1, \2)", main_content)
        if citation_subs > 0:
            logging.debug(f"Made {citation_subs} citation simplifications in {file_path}")

        # 2. Simplify footnotes: [Footnote N](#...) -> [Footnote N]
        modified_content, footnote_subs = FOOTNOTE_PATTERN.subn(r"\1", modified_content)
        if footnote_subs > 0:
            logging.debug(f"Made {footnote_subs} footnote simplifications in {file_path}")

        # Combine modified main content with original references
        final_content = modified_content + "".join(reference_content_lines)

        # Check if content actually changed
        if final_content == "".join(lines):
             logging.info(f"No changes needed for: {file_path}")
             return True # Considered success as no errors occurred

        # Write modified content back to the file (in-place)
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(final_content)
            logging.info(f"Successfully processed and updated: {file_path}")
            return True # Indicate success
        except Exception as e:
            logging.error(f"Error writing updated file {file_path}: {e}")
            return False


    except FileNotFoundError:
        logging.error(f"Error: File not found during processing - {file_path}")
        return False
    except PermissionError:
        logging.error(f"Error: Permission denied for file - {file_path}")
        return False
    except Exception as e:
        logging.error(f"Unexpected error processing file {file_path}: {e}", exc_info=True) # Include traceback
        return False

# --- Main Execution ---
def main():
    """Main function to orchestrate the script execution."""
    setup_logging()
    args = parse_arguments()
    directory = args.directory

    if not os.path.isdir(directory):
        logging.critical(f"Error: Input path is not a valid directory: {directory}")
        sys.exit(1) # Exit with error code

    markdown_files = find_markdown_files(directory)

    if not markdown_files:
        logging.info(f"No Markdown files found in directory: {directory}")
        sys.exit(0) # Exit normally

    logging.info(f"Found {len(markdown_files)} Markdown files to process.")

    success_count = 0
    error_count = 0

    for file_path in markdown_files:
        if process_markdown_file(file_path):
            success_count += 1
        else:
            error_count += 1

    # Log summary
    logging.info("--- Processing Summary ---")
    logging.info(f"Total files found: {len(markdown_files)}")
    logging.info(f"Successfully processed/checked: {success_count}")
    logging.info(f"Errors encountered: {error_count}")
    logging.info("--------------------------")
    logging.info(f"Log file saved to: {LOG_FILE_NAME}")

    if error_count > 0:
        sys.exit(1) # Exit with error code if any files failed

# --- Entry Point ---
if __name__ == "__main__":
    main()