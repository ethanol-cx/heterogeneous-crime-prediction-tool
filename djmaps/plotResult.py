import pandas as pd
import sys
import matplotlib.pyplot as plt

if __name__ == "__main__":
    file_path = sys.argv[1]
    image_path = sys.argv[2]
    result = pd.read_pickle(file_path)
    plt.plot(result)
    plt.legend()
    plt.savefig(image_path)
    plt.close()