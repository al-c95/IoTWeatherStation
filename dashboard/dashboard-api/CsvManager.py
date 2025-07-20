import csv
import os


class CsvManager:


    def __init__(self, filepath):
        self.filepath = filepath
        # check if file exists to decide if header should be written
        self.file_exists = os.path.isfile(self.filepath)


    def write_header(self, headers):
        if not self.file_exists:
            with open(self.filepath, mode='w', newline='') as file:
                writer = csv.writer(file)
                writer.writerow(headers)
            self.file_exists = True


    def write_row(self, row):
        with open(self.filepath, mode='a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(row)